import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ToolMonitor from './components/ToolMonitor';
import Analytics from './components/Analytics';
import SettingsView from './components/Settings';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Play, Cpu, Terminal, CheckCircle2, ArrowRight } from 'lucide-react';

const BACKEND_URL = "http://localhost:8000";

export default function App() {
  const [currentView, setView] = useState('landing');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Simulated watch demo timeline
  const demoSteps = [
    {
      title: "1. ANALYZING QUERY",
      type: "plan",
      content: "User query: 'What is the weather in Hyderabad?'\n\nStrategy:\n- Identify location: 'Hyderabad'\n- Select tool: 'get_weather'\n- Execute tool and observe results."
    },
    {
      title: "2. EXECUTING WEATHER TOOL",
      type: "action",
      content: "Calling Tool: get_weather\nInput: 'Hyderabad'"
    },
    {
      title: "3. WEATHER OBSERVATION",
      type: "observe",
      content: "wttr.in output: 'The weather in Hyderabad is Cloudy +28°C.'"
    },
    {
      title: "4. SYNTHESIZING RESPONSE",
      type: "output",
      content: "Final Response: The current weather in Hyderabad is cloudy and 28°C. Let me know if you need anything else!"
    }
  ];

  const handleNextDemoStep = () => {
    if (demoStep < demoSteps.length - 1) {
      setDemoStep(prev => prev + 1);
    } else {
      setDemoStep(0);
      setDemoOpen(false);
      setView('chat'); // Open app directly
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'chat':
        return null;
      case 'tools':
        return <ToolMonitor backendUrl={BACKEND_URL} />;
      case 'analytics':
        return <Analytics backendUrl={BACKEND_URL} />;
      case 'settings':
        return <SettingsView backendUrl={BACKEND_URL} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Layered background system */}
      <div className="space-bg">
        <div className="noise-overlay" />
        <div className="radial-glow-purple" />
        <div className="radial-glow-blue" />
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', minHeight: '100vh' }}
          >
            <LandingPage 
              onLaunch={() => setView('chat')} 
              onWatchDemo={() => {
                setDemoOpen(true);
                setDemoStep(0);
              }} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100vh' }}
          >
            <Dashboard
              backendUrl={BACKEND_URL}
              currentView={currentView}
              setView={setView}
              chats={chats}
              setChats={setChats}
              activeChatId={activeChatId}
              setActiveChatId={setActiveChatId}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ width: '100%', height: '100%', overflow: 'hidden' }}
                >
                  {renderActiveView()}
                </motion.div>
              </AnimatePresence>
            </Dashboard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watch Demo Modal */}
      <AnimatePresence>
        {demoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-lg glass-panel-premium p-6 border border-purple-500/20 relative"
              style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.15)' }}
            >
              <button 
                onClick={() => setDemoOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-all border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-white text-base font-bold font-display mb-2 flex items-center gap-1.5">
                <Sparkles size={16} className="text-purple-400" /> Interactive Agent OS Demo
              </h3>
              <p className="text-xs text-gray-400 mb-6">See how the agent splits tasks into reasoning plan blocks, triggers tools, and resolves answers.</p>

              {/* Progress bar */}
              <div className="w-full bg-white/5 h-1 rounded-full mb-6 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((demoStep + 1) / demoSteps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Current Step Display */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/40 min-h-[160px] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-2 font-bold">
                    {demoSteps[demoStep].title}
                  </span>
                  <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {demoSteps[demoStep].content}
                  </pre>
                </div>

                <div className="flex justify-between items-center mt-6 border-t border-white/5 pt-3">
                  <span className="text-[10px] text-gray-500 font-mono">Step {demoStep + 1} of {demoSteps.length}</span>
                  <button 
                    onClick={handleNextDemoStep}
                    className="px-4 py-1.5 rounded bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 flex items-center gap-1 border-none cursor-pointer"
                  >
                    {demoStep === demoSteps.length - 1 ? "Launch App" : "Next Step"} <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
