import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Terminal, Cpu, CloudRain, HelpCircle, Calculator, FileText, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage({ onLaunch, onWatchDemo }) {
  const [activeStep, setActiveStep] = useState(0);

  // Auto loop the floating reasoning cards to demonstrate Plan -> Action -> Observe -> Output
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const reasoningSteps = [
    {
      title: "Plan",
      desc: "Deconstruct intent & select node path",
      content: "Query: 'Is London weather suitable for running, and what is its population?'\n\nPlan:\n1. Execute get_weather for 'London'.\n2. Query Wikipedia for 'London population'.",
      color: "var(--color-plan)",
      icon: <Cpu size={14} className="text-blue-400" />
    },
    {
      title: "Action",
      desc: "Execute sub-routine tool calls",
      content: "Calling Tool: get_weather\nInput: 'London'\n\nCalling Tool: search_wikipedia\nInput: 'London population'",
      color: "var(--color-action)",
      icon: <Terminal size={14} className="text-purple-400" />
    },
    {
      title: "Observe",
      desc: "Listen and ingest output logs",
      content: "Weather Output: 'The weather in London is Sunny 21°C.'\n\nWikipedia Output: 'London has an estimated population of 8.9 million...'",
      color: "var(--color-observe)",
      icon: <CloudRain size={14} className="text-orange-400" />
    },
    {
      title: "Output",
      desc: "Compile and present final synthesis",
      content: "Final Response: The weather in London is currently sunny and 21°C, which is excellent for running. The city has a population of approximately 8.9 million people.",
      color: "var(--color-output)",
      icon: <CheckCircle size={14} className="text-emerald-400" />
    }
  ];

  return (
    <div className="landing-wrapper">
      {/* Radial glow decorations */}
      <div className="radial-glow-purple" />
      <div className="radial-glow-blue" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="landing-header"
      >
        <div className="logo-badge">
          <div className="logo-icon-container">
            <Sparkles size={20} className="text-white" />
          </div>
          <span>AgentOS</span>
          <span style={{ fontSize: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: '12px', fontFamily: 'var(--font-mono)' }}>AI</span>
        </div>
        <button onClick={onLaunch} className="btn-pill-dark">
          Open App <ArrowRight size={14} />
        </button>
      </motion.header>

      {/* Hero Content */}
      <main className="landing-hero">
        
        {/* Left Headline */}
        <div className="hero-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="tag-glow"
          >
            <Sparkles size={12} /> Autonomous Tool Invocations
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-title"
          >
            AI That Doesn't <br />
            Just Chat. <span className="gradient-text-accent">It Acts.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-subtitle"
          >
            Watch an autonomous AI plan, execute specialized tools, observe results, and solve complex problems in real time.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="cta-group"
          >
            <button onClick={onLaunch} className="btn-gradient">
              Launch Agent <Play size={14} fill="white" />
            </button>
            <button onClick={onWatchDemo} className="btn-outline">
              Watch Execution Demo
            </button>
          </motion.div>
        </div>

        {/* Right Large AI Orb & Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
          
          {/* AI Orb Animation */}
          <motion.div 
            className="ai-orb-outer"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <div className="ai-orb-glow" />
            <div className="ai-orb-core" />
            <div className="ai-orb-ring-1" />
            <div className="ai-orb-ring-2" />
          </motion.div>

          {/* Reasoning Simulator Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="simulator-panel"
            style={{ width: '100%' }}
          >
            <div className="simulator-header">
              <div className="simulator-title">
                <Cpu size={16} className="text-purple-400" /> Reasoning showcase
              </div>
              <div className="simulator-status">
                <div className="simulator-indicator" />
                <span>REAL-TIME PIPELINE</span>
              </div>
            </div>

            <div className="simulator-cards-container">
              {reasoningSteps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div 
                    key={idx}
                    className={`sim-card ${isActive ? 'active' : ''}`}
                  >
                    <div className="sim-card-header">
                      <div className="sim-card-badge" style={{ color: isActive ? step.color : 'var(--text-muted)' }}>
                        {step.icon}
                        <span style={{ marginLeft: '6px' }}>{step.title}</span>
                      </div>
                      <span className="sim-card-step">STEP {idx + 1}</span>
                    </div>
                    <p className="sim-card-desc">{step.desc}</p>
                    {isActive && (
                      <motion.pre 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="sim-card-terminal"
                      >
                        {step.content}
                      </motion.pre>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </main>

      {/* Features section */}
      <section className="features-section">
        <div className="features-header">
          <h2>Mission Control Subsystems</h2>
          <p>AgentOS AI coordinates specialized tools to solve computations, query system parameters, and aggregate files.</p>
        </div>

        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <Cpu className="text-blue-400" size={18} />
            </div>
            <div>
              <h4>AI Reasoning Engine</h4>
              <p>Step-by-step thinking loop allowing the agent to evaluate complex user requests and decide strategy.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
              <Terminal className="text-purple-400" size={18} />
            </div>
            <div>
              <h4>Tool Calling System</h4>
              <p>Autonomous and dynamic selection of external API integrations based on prompt requirements.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <CloudRain className="text-sky-400" size={18} />
            </div>
            <div>
              <h4>Weather Retrieval</h4>
              <p>Integrated real-time weather statistics by querying wttr.in dynamically for any location.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
              <HelpCircle className="text-amber-400" size={18} />
            </div>
            <div>
              <h4>Wikipedia Search</h4>
              <p>Queries Wikipedia database for instant facts on historical topics, people, and places.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
              <Calculator className="text-rose-400" size={18} />
            </div>
            <div>
              <h4>Calculator Tool</h4>
              <p>Solves standard mathematical expressions safely without token errors or math hallucination.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.15)' }}>
              <Terminal className="text-orange-400" size={18} />
            </div>
            <div>
              <h4>Command Execution</h4>
              <p>Executes system commands, lists folders, and handles administrative scripts directly on host shell.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <FileText className="text-indigo-400" size={18} />
            </div>
            <div>
              <h4>Agent Memory</h4>
              <p>Maintains context and history parameters between user requests for fluid conversations.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-container" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <CheckCircle className="text-emerald-400" size={18} />
            </div>
            <div>
              <h4>Real-Time Execution</h4>
              <p>Streams step-by-step thinking outputs and intermediate logs using Server-Sent Events (SSE).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        &copy; {new Date().getFullYear()} AgentOS AI. Commercial AI System Platform.
      </footer>
    </div>
  );
}
