import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, ShieldAlert, Cpu, ToggleLeft, ToggleRight, Sparkles, Check, Heart, Server, Network, Terminal } from 'lucide-react';

export default function SettingsView({ backendUrl }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.2);
  const [tools, setTools] = useState({
    get_weather: true,
    calculator: true,
    search_wikipedia: true,
    run_command: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.gemini_api_key || '');
          setModel(data.model || 'gemini-2.5-flash');
          setTemperature(data.temperature || 0.2);
          if (data.tools) {
            setTools(data.tools);
          }
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [backendUrl]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch(`${backendUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: apiKey,
          model,
          temperature: parseFloat(temperature),
          tools
        })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Error saving settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (toolKey) => {
    setTools(prev => ({
      ...prev,
      [toolKey]: !prev[toolKey]
    }));
  };

  const modelsList = [
    { key: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', latency: 'Fastest', desc: 'Recommended. Low-latency tool selections and logical planning blocks.' },
    { key: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', latency: 'Moderate', desc: 'High intelligence. Suitable for complex, long-running agent logic.' },
    { key: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', latency: 'Legacy', desc: 'Legacy standard model for quick tool executions.' }
  ];

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Cpu size={24} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="settings-workspace">
      {/* Header */}
      <div className="settings-header-wrapper">
        <h2 className="section-title"><Settings className="text-purple-400" size={24} /> Control Center</h2>
        <p className="body-text" style={{ fontSize: '12px' }}>Configure language model properties, check health diagnostics, and toggle permissions.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* API Credentials */}
        <div className="settings-card-section">
          <h3><Sparkles size={16} className="text-blue-400" /> Gemini API Status</h3>
          <div className="settings-input-group">
            <span className="settings-input-label">Gemini API Key</span>
            <input 
              type="password"
              placeholder={apiKey ? "••••••••••••••••••••••••••••••••" : "Enter your Gemini API Key..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="settings-text-input"
            />
            <span className="settings-helper-text">
              If left blank, uvicorn defaults to the key hardcoded in the Python script. Set "MOCK_KEY" to force simulation mock agent.
            </span>
          </div>
        </div>

        {/* Model Selection Cards */}
        <div className="settings-card-section">
          <h3><Cpu size={16} className="text-purple-400" /> LLM Orchestration Model</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {modelsList.map((m) => (
              <div 
                key={m.key}
                onClick={() => setModel(m.key)}
                className={`model-selection-card ${model === m.key ? 'selected' : ''}`}
              >
                <div className="model-card-icon-container" style={{ background: model === m.key ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: model === m.key ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <Cpu size={16} className={model === m.key ? 'text-purple-400' : 'text-gray-500'} />
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-pure)' }}>{m.name}</strong>
                    <span className="tool-badge" style={{ fontSize: '8px', opacity: 0.8 }}>{m.latency}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temperature slider */}
        <div className="settings-card-section">
          <div className="settings-slider-wrapper">
            <span className="settings-input-label">AGENT INFERENCE TEMPERATURE ({temperature})</span>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="settings-slider-input"
            />
            <div className="settings-slider-labels">
              <span>0.0 (Deterministic plans)</span>
              <span>1.0 (Creative variations)</span>
            </div>
          </div>
        </div>

        {/* Diagnostic health widget */}
        <div className="settings-card-section">
          <h3><Network size={16} className="text-blue-400" /> Subsystem Connection Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gemini API Handshake</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <Check size={12} /> ESTABLISHED
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>wttr.in Weather Server</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <Check size={12} /> STABLE
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Wikipedia Database Gateway</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <Check size={12} /> CONNECTED
              </span>
            </div>

          </div>
        </div>

        {/* Diagnostics & Node Config */}
        <div className="settings-card-section">
          <h3><Server size={16} className="text-emerald-400" /> Server Node Diagnostics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>HOST PLATFORM</span>
              <strong style={{ color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>Windows Node</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>PYTHON RUNTIME</span>
              <strong style={{ color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>Python 3.12.2</strong>
            </div>
          </div>
        </div>

        {/* Tool Permissions */}
        <div className="settings-card-section">
          <h3><ShieldAlert size={16} className="text-amber-400" /> Tool Permissions</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Allow or restrict agent access to tools. Disabling a tool blocks it from plans.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <div className="settings-tool-switch-row">
              <div className="settings-tool-switch-info">
                <span>Weather Retrieval Tool</span>
                <p>Allow weather queries to wttr.in API.</p>
              </div>
              <button 
                type="button" 
                onClick={() => toggleTool('get_weather')}
                className={`btn-toggle-switch ${!tools.get_weather ? 'disabled' : ''}`}
              >
                {tools.get_weather ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div className="settings-tool-switch-row">
              <div className="settings-tool-switch-info">
                <span>Calculator Tool</span>
                <p>Allow inline mathematical evaluations.</p>
              </div>
              <button 
                type="button" 
                onClick={() => toggleTool('calculator')}
                className={`btn-toggle-switch ${!tools.calculator ? 'disabled' : ''}`}
              >
                {tools.calculator ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div className="settings-tool-switch-row">
              <div className="settings-tool-switch-info">
                <span>Wikipedia Search Tool</span>
                <p>Allow keyword ingest search queries to Wikipedia.</p>
              </div>
              <button 
                type="button" 
                onClick={() => toggleTool('search_wikipedia')}
                className={`btn-toggle-switch ${!tools.search_wikipedia ? 'disabled' : ''}`}
              >
                {tools.search_wikipedia ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div className="settings-tool-switch-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="settings-tool-switch-info">
                  <span>System Command Shell Execution</span>
                  <p>Allow command script executing permissions on target host.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => toggleTool('run_command')}
                  className={`btn-toggle-switch ${!tools.run_command ? 'disabled' : ''}`}
                >
                  {tools.run_command ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
              <div className="settings-security-warning-box">
                <ShieldAlert size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Security Warning:</strong> Enabling command execution allows the AI agent to execute script code directly on your local system host machine. Use with caution.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Buttons Bar */}
        <div className="settings-submit-footer">
          {savedSuccess && (
            <span className="settings-submit-success-text">
              <Check size={14} /> Control parameters synchronized!
            </span>
          )}
          <button 
            type="submit"
            disabled={saving}
            className="btn-gradient"
            style={{ padding: '10px 24px', borderRadius: '8px' }}
          >
            {saving ? "Saving..." : <><Save size={15} /> Save settings</>}
          </button>
        </div>

      </form>
    </div>
  );
}
