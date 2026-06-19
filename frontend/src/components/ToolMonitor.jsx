import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, XCircle, Search, RefreshCw, Calendar, Clock, CloudRain, Calculator, HelpCircle, Activity } from 'lucide-react';

export default function ToolMonitor({ backendUrl }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToolFilter, setSelectedToolFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedExec, setSelectedExec] = useState(null);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/executions`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data);
        if (data.length > 0 && !selectedExec) {
          setSelectedExec(data[0]);
        }
      }
    } catch (e) {
      console.error("Error fetching executions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [backendUrl]);

  // Aggregate stats per tool
  const getToolStats = (toolKey) => {
    const toolExecs = executions.filter(e => e.tool === toolKey);
    const total = toolExecs.length;
    const success = toolExecs.filter(e => e.status === 'success').length;
    const durations = toolExecs.map(e => e.duration);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / total : 0.0;
    
    // Sparkline points
    const latest10 = toolExecs.slice(0, 10).reverse().map(e => e.duration);
    
    return {
      total,
      successRate: total > 0 ? Math.round((success / total) * 100) : 100,
      avgLatency: avgDuration,
      history: latest10
    };
  };

  const filteredExecutions = executions.filter(item => {
    const matchesSearch = item.input.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.output.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tool.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTool = selectedToolFilter === 'all' || item.tool === selectedToolFilter;
    const matchesStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;
    return matchesSearch && matchesTool && matchesStatus;
  });

  const getToolIcon = (tool, size = 18) => {
    switch (tool) {
      case 'get_weather': return <CloudRain size={size} className="text-sky-400" />;
      case 'calculator': return <Calculator size={size} className="text-rose-400" />;
      case 'search_wikipedia': return <HelpCircle size={size} className="text-amber-400" />;
      case 'run_command': return <Terminal size={size} className="text-orange-400" />;
      default: return <Terminal size={size} />;
    }
  };

  const getToolLabel = (tool) => {
    switch (tool) {
      case 'get_weather': return 'Weather wttr';
      case 'calculator': return 'Calculator Math';
      case 'search_wikipedia': return 'Wikipedia Ingest';
      case 'run_command': return 'Terminal Shell';
      default: return tool;
    }
  };

  // Sparkline SVG generator
  const renderSparkline = (history, color) => {
    if (!history || history.length < 2) {
      return (
        <svg width="60" height="24" viewBox="0 0 60 24">
          <line x1="0" y1="12" x2="60" y2="12" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
        </svg>
      );
    }
    const max = Math.max(...history) * 1.2 || 1;
    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * 60;
      const y = 22 - (val / max) * 20;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="60" height="24" viewBox="0 0 60 24" style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const toolCardsInfo = [
    { key: 'get_weather', name: 'Weather wttr', color: '#38bdf8' },
    { key: 'calculator', name: 'Calculator Math', color: '#f87171' },
    { key: 'search_wikipedia', name: 'Wikipedia Ingest', color: '#fbbf24' },
    { key: 'run_command', name: 'Terminal Shell', color: '#fb923c' }
  ];

  return (
    <div className="tool-monitor-workspace">
      {/* Page Header */}
      <div className="tool-monitor-header-wrapper">
        <div>
          <h2 className="section-title"><Terminal className="text-purple-400" size={24} /> Mission Control</h2>
          <p className="body-text" style={{ fontSize: '12px' }}>Real-time telemetry and execution logs of external system dependencies.</p>
        </div>
        <button 
          onClick={fetchExecutions}
          disabled={loading}
          className="btn-pill-dark"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync Logs
        </button>
      </div>

      {/* Tool Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', flexShrink: 0 }}>
        {toolCardsInfo.map((card) => {
          const stats = getToolStats(card.key);
          const isSelected = selectedToolFilter === card.key;
          return (
            <div 
              key={card.key}
              onClick={() => setSelectedToolFilter(isSelected ? 'all' : card.key)}
              className={`monitor-card-premium ${isSelected ? 'active' : ''}`}
              style={{ cursor: 'pointer', borderLeft: isSelected ? `2px solid ${card.color}` : '' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {getToolIcon(card.key, 14)}
                  </div>
                  <strong style={{ fontSize: '12px', color: 'var(--text-pure)' }}>{card.name}</strong>
                </div>
                <div className="monitor-status-pulse" style={{ backgroundColor: card.color, boxShadow: `0 0 8px ${card.color}` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', fontFamily: 'var(--font-mono)' }}>LATENCY / SUCCESS</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {stats.avgLatency.toFixed(2)}s <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>/</span> <span style={{ color: '#10b981' }}>{stats.successRate}%</span>
                  </span>
                </div>
                <div>
                  {renderSparkline(stats.history, card.color)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and search tools */}
      <div className="tool-filters-bar">
        <div className="filter-input-search">
          <Search size={14} className="sidebar-search-icon" />
          <input 
            type="text"
            placeholder="Filter inputs, stdout logs or exit codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedToolFilter}
          onChange={(e) => setSelectedToolFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Tools</option>
          <option value="get_weather">Weather wttr</option>
          <option value="calculator">Calculator Math</option>
          <option value="search_wikipedia">Wikipedia Ingest</option>
          <option value="run_command">Terminal Shell</option>
        </select>
        <select 
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>

      {/* Execution logs and details drawer */}
      <div className="tool-grid-split" style={{ minHeight: 0 }}>
        {/* Table List */}
        <div className="tool-table-card">
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={24} className="animate-spin text-purple-500" />
            </div>
          ) : filteredExecutions.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px' }}>
              <Activity size={28} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>NO INVOKED TELEMETRY MATCHES FILTER</span>
            </div>
          ) : (
            <table className="tool-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>State</th>
                  <th>Subsystem Tool</th>
                  <th>Payload Input</th>
                  <th>Latency</th>
                  <th style={{ textAlign: 'right' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map((exec) => (
                  <tr 
                    key={exec.id}
                    onClick={() => setSelectedExec(exec)}
                    className={selectedExec?.id === exec.id ? 'selected' : ''}
                  >
                    <td>
                      {exec.status === 'success' ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <XCircle size={14} className="text-rose-400" />
                      )}
                    </td>
                    <td>
                      <span className={`tool-badge ${exec.tool}`}>
                        {getToolLabel(exec.tool)}
                      </span>
                    </td>
                    <td className="font-mono" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                      {exec.input}
                    </td>
                    <td className="font-mono">
                      {exec.duration.toFixed(2)}s
                    </td>
                    <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {new Date(exec.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detailed drawer card */}
        <div className="tool-details-card">
          <AnimatePresence mode="wait">
            {selectedExec ? (
              <motion.div 
                key={selectedExec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}
              >
                <div className="tool-details-header">
                  <div>
                    <h4 className="card-title">Console Ingest Drawer</h4>
                    <span className={`tool-badge ${selectedExec.tool}`} style={{ marginTop: '6px' }}>
                      {getToolLabel(selectedExec.tool)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="tool-badge" style={{ backgroundColor: selectedExec.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selectedExec.status === 'success' ? 'var(--color-output)' : 'var(--color-error)' }}>
                      {selectedExec.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="tool-details-kpi-grid">
                  <div className="kpi-block">
                    <div className="kpi-icon-wrapper" style={{ background: 'rgba(139,92,246,0.08)' }}>
                      <Clock size={12} className="text-purple-400" />
                    </div>
                    <div className="kpi-title-block">
                      <span>Invocate Time</span>
                      <strong>{selectedExec.duration.toFixed(3)}s</strong>
                    </div>
                  </div>
                  <div className="kpi-block">
                    <div className="kpi-icon-wrapper" style={{ background: 'rgba(59,130,246,0.08)' }}>
                      <Calendar size={12} className="text-blue-400" />
                    </div>
                    <div className="kpi-title-block">
                      <span>Server Timestamp</span>
                      <strong>
                        {new Date(selectedExec.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                    <div className="tool-detail-section-title">Ingest Payload</div>
                    <div className="tool-detail-payload-container" style={{ flexGrow: 1, marginTop: '4px' }}>
                      <pre className="input">{selectedExec.input}</pre>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                    <div className="tool-detail-section-title">Stdout Capture</div>
                    <div className="tool-detail-payload-container" style={{ flexGrow: 1, marginTop: '4px' }}>
                      <pre className="output">{selectedExec.output}</pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Terminal size={24} className="animate-pulse" />
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Select node log</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
