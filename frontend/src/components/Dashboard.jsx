import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, Search, MessageSquare, Trash2, 
  Send, Copy, RefreshCw, Trash, Download, 
  Cpu, Terminal, CloudRain, Calculator, HelpCircle, 
  CheckCircle, ArrowRight, Menu, ChevronLeft, ChevronRight, Activity, Clock
} from 'lucide-react';

export default function Dashboard({ 
  backendUrl, 
  currentView, 
  setView,
  chats,
  setChats,
  activeChatId,
  setActiveChatId,
  children
}) {
  const [inputMsg, setInputMsg] = useState('');
  const [streamingSteps, setStreamingSteps] = useState([]);
  const [activeStepType, setActiveStepType] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

  // Load chat lists on load
  const loadChatHistory = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !activeChatId) {
          setActiveChatId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [backendUrl]);

  // Toast helper
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Create a new chat session
  const handleNewChat = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/chat/create`, { method: 'POST' });
      if (res.ok) {
        const newChat = await res.json();
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setStreamingSteps([]);
        setActiveStepType(null);
        setView('chat');
        if (chatInputRef.current) chatInputRef.current.focus();
      }
    } catch (e) {
      console.error("Error creating chat:", e);
    }
  };

  // Delete chat
  const handleDeleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${backendUrl}/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== id));
        if (activeChatId === id) {
          const remaining = chats.filter(c => c.id !== id);
          if (remaining.length > 0) {
            setActiveChatId(remaining[0].id);
          } else {
            setActiveChatId(null);
          }
        }
        triggerToast("Conversation deleted");
      }
    } catch (e) {
      console.error("Error deleting chat:", e);
    }
  };

  // Clear all chats
  const handleClearAllChats = async () => {
    if (!window.confirm("Are you sure you want to clear all conversations?")) return;
    try {
      const res = await fetch(`${backendUrl}/api/chat/clear`, { method: 'POST' });
      if (res.ok) {
        setChats([]);
        setActiveChatId(null);
        setStreamingSteps([]);
        setActiveStepType(null);
        triggerToast("All chats cleared");
      }
    } catch (e) {
      console.error("Error clearing chats:", e);
    }
  };

  // Copy Message to clipboard
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast("Copied to clipboard!");
  };

  // Export Chat to Text
  const handleExportChat = () => {
    if (!activeChat) return;
    const historyText = activeChat.messages.map(m => {
      const roleStr = m.role === 'user' ? 'User' : 'Agent';
      let msgStr = `[${new Date(m.timestamp * 1000).toLocaleString()}] ${roleStr}:\n${m.content}\n`;
      if (m.steps && m.steps.length > 0) {
        msgStr += `Reasoning Process:\n` + m.steps.map((s, i) => `  Step ${i+1} (${s.step}): ${s.content || s.function || s.output}`).join('\n') + '\n';
      }
      return msgStr;
    }).join('\n====================\n\n');

    const element = document.createElement("a");
    const file = new Blob([historyText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `AgentOS_${activeChat.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast("Chat exported successfully!");
  };

  // Submit Prompt
  const handleSubmit = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const prompt = (customMsg || inputMsg).trim();
    if (!prompt || isTyping) return;

    setInputMsg('');
    setIsTyping(true);
    setStreamingSteps([]);
    setActiveStepType(null);

    const tempUserMsg = {
      id: 'temp-user',
      role: 'user',
      content: prompt,
      timestamp: Date.now() / 1000
    };

    let chatId = activeChatId;
    if (!chatId) {
      try {
        const createRes = await fetch(`${backendUrl}/api/chat/create`, { method: 'POST' });
        if (createRes.ok) {
          const newChat = await createRes.json();
          chatId = newChat.id;
          setActiveChatId(chatId);
          setChats(prev => [newChat, ...prev]);
        }
      } catch (e) {
        console.error("Error creating chat on prompt submit:", e);
        setIsTyping(false);
        return;
      }
    }

    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return { ...c, messages: [...c.messages, tempUserMsg] };
      }
      return c;
    }));

    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message: prompt })
      });

      if (!response.ok) throw new Error("Connection failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const rawData = line.slice(6).trim();
              if (!rawData) continue;
              const stepData = JSON.parse(rawData);

              setStreamingSteps(prev => [...prev, stepData]);
              setActiveStepType(stepData.step);
            } catch (jsonErr) {
              console.error("Error parsing streaming line:", jsonErr, line);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error in chat stream:", err);
      setStreamingSteps(prev => [...prev, {
        step: "output",
        content: "Error: Failed to stream response from agent. Please verify backend is running."
      }]);
    } finally {
      setIsTyping(false);
      await loadChatHistory();
    }
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'plan': return <Cpu size={14} className="text-blue-400" />;
      case 'action': return <Terminal size={14} className="text-purple-400" />;
      case 'observe': return <CloudRain size={14} className="text-orange-400" />;
      case 'output': return <CheckCircle size={14} className="text-emerald-400" />;
      default: return <Cpu size={14} />;
    }
  };

  const filteredChats = chats.filter(c => 
    c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="app-container">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-5 right-5 z-50 glass-panel-premium px-4 py-2.5 text-xs border border-purple-500/25 text-white grad-glow-purple"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Glass Sidebar (Cursor + Linear Style) */}
      <motion.aside 
        animate={{ 
          width: sidebarCollapsed ? 76 : 260,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sidebar-floating-glass"
      >
        {/* Brand / Logo */}
        <div className="sidebar-brand-glow" style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Sparkles size={14} className="text-white" />
            </div>
            {!sidebarCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>AgentOS</motion.span>}
          </div>
          
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn-header-tool"
            style={{ border: 'none', background: 'transparent' }}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <button 
            onClick={() => setView('chat')}
            className={`nav-btn ${currentView === 'chat' ? 'active' : ''}`}
            title="Chat workspace"
          >
            <MessageSquare size={16} />
            {!sidebarCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Agent Chat</motion.span>}
          </button>
          <button 
            onClick={() => setView('tools')}
            className={`nav-btn ${currentView === 'tools' ? 'active' : ''}`}
            title="Execution monitor"
          >
            <Terminal size={16} />
            {!sidebarCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Tool Monitor</motion.span>}
          </button>
          <button 
            onClick={() => setView('analytics')}
            className={`nav-btn ${currentView === 'analytics' ? 'active' : ''}`}
            title="System analytics"
          >
            <Activity size={16} />
            {!sidebarCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Analytics</motion.span>}
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
            title="Settings & Key"
          >
            <Cpu size={16} />
            {!sidebarCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Settings</motion.span>}
          </button>
        </nav>

        {/* Action Button */}
        <div className="sidebar-action-btn-container" style={{ padding: sidebarCollapsed ? '10px' : '16px 14px' }}>
          <button 
            onClick={handleNewChat} 
            className="btn-sidebar-action" 
            style={{ padding: sidebarCollapsed ? '10px' : '10px 16px' }}
            title="Create session"
          >
            <Plus size={14} />
            {!sidebarCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>New Chat</motion.span>}
          </button>
        </div>

        {/* History Search bar */}
        {!sidebarCollapsed && (
          <div className="sidebar-search-container">
            <Search size={12} className="sidebar-search-icon" />
            <input 
              type="text"
              placeholder="Search chat histories..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="sidebar-search-input"
            />
          </div>
        )}

        {/* Chat History List */}
        <div className="history-list">
          {filteredChats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                setStreamingSteps([]);
                setActiveStepType(null);
                setView('chat');
              }}
              className={`sidebar-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}
            >
              <div className="history-item-left">
                <MessageSquare size={13} />
                {!sidebarCollapsed && <span className="history-item-title">{chat.title}</span>}
              </div>
              {!sidebarCollapsed && (
                <button 
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="history-item-delete-btn"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Widgets (Linear style Memory & Load) */}
        {!sidebarCollapsed && (
          <div style={{ padding: '0 4px' }}>
            <div className="sidebar-widget">
              <div className="sidebar-widget-label">
                <span>CONTEXT UTILIZATION</span>
                <span>14%</span>
              </div>
              <div className="sidebar-widget-bar">
                <div className="sidebar-widget-bar-fill" style={{ width: '14%' }} />
              </div>
            </div>
            <div className="sidebar-widget" style={{ marginTop: '0px' }}>
              <div className="sidebar-widget-label">
                <span>TOOL HEALTH STATE</span>
                <span>99.2%</span>
              </div>
              <div className="sidebar-widget-bar">
                <div className="sidebar-widget-bar-fill" style={{ width: '99.2%', background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="sidebar-footer" style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
          <button onClick={handleClearAllChats} className="btn-sidebar-footer" title="Clear all histories">
            <Trash size={12} />
            {!sidebarCollapsed && <span>Clear all</span>}
          </button>
        </div>
      </motion.aside>

      {/* Center Panel */}
      <div className="center-content-wrapper">
        
        {currentView !== 'chat' ? (
          children
        ) : (
          /* Main Chat Workspace Layout */
          <div className="chat-workspace">
            
            {/* Center chat stream Thread */}
            <div className="chat-thread-container">
              
              {/* Header */}
              <div className="chat-thread-header">
                <div>
                  <h3 className="chat-header-title">
                    {activeChat ? activeChat.title : "New Conversation"}
                  </h3>
                  <div className="chat-header-status">
                    <span className={`chat-header-status-dot ${isTyping ? 'active' : 'ready'}`} />
                    <span className="chat-header-status-text">
                      {isTyping ? 'AGENT RUNNING SEQUENCES' : 'AGENT MONITOR ONLINE'}
                    </span>
                  </div>
                </div>

                <div className="flex" style={{ gap: '8px' }}>
                  {activeChat && (
                    <button 
                      onClick={handleExportChat}
                      className="btn-header-tool"
                      title="Export Chat History"
                    >
                      <Download size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Message scroll list */}
              <div className="chat-messages-scroll-area">
                {!activeChat || activeChat.messages.length === 0 ? (
                  /* Empty state workspace suggested prompts */
                  <div className="empty-chat-panel animate-fade-in">
                    <div className="empty-chat-icon-orb animate-float">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="card-title">Commercial AI Agent Dashboard</h3>
                      <p style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>Input a prompt below. The agent will formulate planning nodes, call system tool APIs, observe responses, and output summaries.</p>
                    </div>

                    <div className="suggested-grid">
                      {suggestedPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSubmit(null, p.text)}
                          className="btn-suggested-prompt"
                        >
                          <span className="btn-suggested-prompt-text">{p.text}</span>
                          <span className="btn-suggested-prompt-tool">Calls {p.tool}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Message render loop wrapped with animations */
                  <div className="chat-messages-max-width">
                    {activeChat.messages.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <motion.div 
                          key={msg.id} 
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className={`message-row ${isUser ? 'user' : 'agent'}`}
                        >
                          
                          {/* Agent Avatar */}
                          {!isUser && (
                            <div className="message-avatar agent">
                              <Sparkles size={14} className="text-white" />
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className="chat-message-bubble-premium">
                            <button 
                              onClick={() => handleCopyMessage(msg.content)}
                              className="btn-message-copy"
                              title="Copy Message"
                            >
                              <Copy size={11} />
                            </button>

                            <div className="message-bubble-header">
                              {isUser ? 'USER COMMAND' : 'AGENT CONTEXT OUTPUT'}
                            </div>

                            <div className="markdown-content">
                              {msg.content}
                            </div>

                            {/* Render steps inside the message itself */}
                            {!isUser && msg.steps && msg.steps.length > 0 && (
                              <details style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-glow)' }}>
                                <summary style={{ fontSize: '10px', color: 'var(--neon-purple)', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
                                  Show execution traceback ({msg.steps.length} steps)
                                </summary>
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {msg.steps.map((step, idx) => (
                                    <div 
                                      key={idx} 
                                      className="code-block-wrapper"
                                      style={{ margin: '0' }}
                                    >
                                      <div className="code-block-header">
                                        <span>STEP {idx + 1} — {step.step.toUpperCase()}</span>
                                      </div>
                                      <div style={{ padding: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                        {step.content && <p style={{ color: 'var(--text-primary)' }}>{step.content}</p>}
                                        {step.function && (
                                          <p style={{ color: '#c084fc', marginTop: '4px' }}>
                                            Triggering: <strong>{step.function}</strong>({step.input})
                                          </p>
                                        )}
                                        {step.output && (
                                          <pre style={{ margin: '8px 0 0', padding: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '10px', color: 'var(--color-observe)', overflowX: 'auto', maxHeight: '120px' }}>
                                            {step.output}
                                          </pre>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>

                          {/* User Avatar */}
                          {isUser && (
                            <div className="message-avatar user">
                              U
                            </div>
                          )}

                        </motion.div>
                      );
                    })}

                    {/* Active typing loader */}
                    {isTyping && (
                      <div className="message-row agent">
                        <div className="message-avatar agent animate-pulse">
                          <Sparkles size={14} className="text-white" />
                        </div>
                        <div className="chat-message-bubble-premium" style={{ minWidth: '130px' }}>
                          <div className="message-bubble-header font-mono" style={{ fontSize: '9px' }}>PIPELINE LOGS</div>
                          <div className="typing-dots" style={{ padding: '4px 0' }}>
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input form wrapper */}
              <div className="chat-input-container">
                <form onSubmit={handleSubmit} className="chat-input-form-wrapper">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    disabled={isTyping}
                    placeholder={isTyping ? "Agent executing reasoning loop..." : "Solve computations, get weather, search wiki, or execute host shell commands..."}
                    className="chat-text-input"
                  />
                  <button 
                    type="submit"
                    disabled={isTyping || !inputMsg.trim()}
                    className="btn-chat-send"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>

            </div>

            {/* Right Agent Reasoning Panel */}
            <aside className="reasoning-sidebar">
              <div className="reasoning-sidebar-header">
                <div>
                  <h4>Execution Timeline</h4>
                  <p>Real-time telemetry pipeline streams.</p>
                </div>
                {isTyping && (
                  <span className="monitor-status-pulse" />
                )}
              </div>

              {/* Flow Timeline Steps */}
              <div className="reasoning-scroll-area">
                {/* Connecting timeline path */}
                {streamingSteps.length > 0 && (
                  <div className="reasoning-flow-connector">
                    <motion.div 
                      className="reasoning-flow-progress-line"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(100, (streamingSteps.length / 4) * 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {streamingSteps.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={24} className="text-slate-700 animate-pulse" />
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Waiting for Prompt</span>
                  </div>
                ) : (
                  streamingSteps.map((step, idx) => {
                    const isLast = idx === streamingSteps.length - 1;
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="reasoning-node-item"
                      >
                        <div className={`reasoning-node-dot ${isLast && isTyping ? 'active' : ''}`}>
                          {idx + 1}
                        </div>

                        <div className={`reasoning-card ${step.step}`}>
                          <div className="reasoning-card-title-bar">
                            <h5>{getStepIcon(step.step)} <span style={{ marginLeft: '6px' }}>{step.step}</span></h5>
                            {step.step === 'action' && step.function && (
                              <span className="reasoning-card-badge tool">{step.function}</span>
                            )}
                          </div>

                          {step.content && (
                            <p className="reasoning-card-content">{step.content}</p>
                          )}

                          {step.step === 'action' && step.input && (
                            <div className="reasoning-card-code input">
                              {step.input}
                            </div>
                          )}

                          {step.step === 'observe' && step.output && (
                            <div className="reasoning-card-code output">
                              {step.output}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="reasoning-sidebar-footer">
                <span className="footer-pulse-dot animate-pulse" />
                <span>AgentOS SDK Ingest Engine</span>
              </div>
            </aside>

          </div>
        )}
      </div>

    </div>
  );
}
