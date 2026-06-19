import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Activity, RefreshCw, Zap, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Analytics({ backendUrl }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animated counters state
  const [queriesCount, setQueriesCount] = useState(0);
  const [latencyCount, setLatencyCount] = useState(0.0);
  const [successRateCount, setSuccessRateCount] = useState(0);
  const [executionsCount, setExecutionsCount] = useState(0);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/analytics`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [backendUrl]);

  // Animate counter values on stats load
  useEffect(() => {
    if (!stats) return;
    
    // Animate Queries
    let qStart = 0;
    const qEnd = stats.total_queries || 0;
    const qTimer = setInterval(() => {
      if (qStart >= qEnd) {
        setQueriesCount(qEnd);
        clearInterval(qTimer);
      } else {
        qStart += Math.ceil((qEnd - qStart) / 8) || 1;
        setQueriesCount(qStart);
      }
    }, 20);

    // Animate Latency
    let lStart = 0.0;
    const lEnd = stats.average_response_time || 0.0;
    const lTimer = setInterval(() => {
      if (lStart >= lEnd - 0.05) {
        setLatencyCount(lEnd);
        clearInterval(lTimer);
      } else {
        lStart += (lEnd - lStart) / 6;
        setLatencyCount(parseFloat(lStart.toFixed(2)));
      }
    }, 30);

    // Animate Success Rate
    const totalExecutions = stats.total_executions || 0;
    const successfulExecutions = stats.successful_executions || 0;
    const rateEnd = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 100;
    let rStart = 0;
    const rTimer = setInterval(() => {
      if (rStart >= rateEnd) {
        setSuccessRateCount(rateEnd);
        clearInterval(rTimer);
      } else {
        rStart += Math.ceil((rateEnd - rStart) / 8) || 1;
        setSuccessRateCount(rStart);
      }
    }, 20);

    // Animate executions
    let eStart = 0;
    const eEnd = totalExecutions;
    const eTimer = setInterval(() => {
      if (eStart >= eEnd) {
        setExecutionsCount(eEnd);
        clearInterval(eTimer);
      } else {
        eStart += Math.ceil((eEnd - eStart) / 8) || 1;
        setExecutionsCount(eStart);
      }
    }, 20);

    return () => {
      clearInterval(qTimer);
      clearInterval(lTimer);
      clearInterval(rTimer);
      clearInterval(eTimer);
    };
  }, [stats]);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={24} className="animate-spin text-purple-500" />
      </div>
    );
  }

  const totalToolCalls = stats?.total_executions || 0;
  const toolUsage = stats?.tool_usage || {};
  const recentExecutions = stats?.recent_executions || [];

  const formatToolName = (name) => {
    return name.replace('get_', '').replace('search_', '').replace('_', ' ');
  };

  // Tool usage donut rendering logic
  const toolKeys = Object.keys(toolUsage);
  const toolValues = Object.values(toolUsage);

  let cumulativePercent = 0;
  const colors = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981'];
  
  const slices = toolKeys.map((key, i) => {
    const value = toolUsage[key];
    const percent = totalToolCalls > 0 ? value / totalToolCalls : 0;
    
    const x1 = Math.cos(2 * Math.PI * cumulativePercent);
    const y1 = Math.sin(2 * Math.PI * cumulativePercent);
    cumulativePercent += percent;
    const x2 = Math.cos(2 * Math.PI * cumulativePercent);
    const y2 = Math.sin(2 * Math.PI * cumulativePercent);
    
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    const r = 40;
    const cx = 50;
    const cy = 50;
    
    const sx = cx + r * x1;
    const sy = cy + r * y1;
    const ex = cx + r * x2;
    const ey = cy + r * y2;
    
    const pathData = percent === 1
      ? `M 50 10 A 40 40 0 1 1 49.999 10 Z`
      : `M ${sx} ${sy} A ${r} ${r} 0 ${largeArcFlag} 1 ${ex} ${ey}`;
      
    return {
      name: key,
      value,
      percent: Math.round(percent * 100),
      pathData,
      color: colors[i % colors.length]
    };
  });

  // Line Points coordinate logic
  const linePoints = recentExecutions.length > 0
    ? recentExecutions.slice(0, 10).reverse()
    : [
        { duration: 0.8 },
        { duration: 1.2 },
        { duration: 1.5 },
        { duration: 0.6 },
        { duration: 1.1 },
        { duration: 0.9 }
      ];

  const maxVal = Math.max(...linePoints.map(p => p.duration || 0)) * 1.2 || 2;
  const chartHeight = 100;
  const chartWidth = 350;

  const pointsString = linePoints.map((p, idx) => {
    const x = (idx / (linePoints.length - 1)) * chartWidth;
    const val = p.duration || 0;
    const y = chartHeight - (val / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaString = linePoints.length > 0
    ? `${pointsString} ${chartWidth},${chartHeight} 0,${chartHeight}`
    : '';

  return (
    <div className="analytics-workspace">
      {/* Page Header */}
      <div className="analytics-header-wrapper">
        <div>
          <h2 className="section-title"><BarChart3 className="text-purple-400" size={24} /> Telemetry Analytics</h2>
          <p className="body-text" style={{ fontSize: '12px' }}>Venture-scale execution graphs and historical query distributions.</p>
        </div>
        <button onClick={fetchAnalytics} className="btn-pill-dark">
          <RefreshCw size={12} /> Sync Analytics
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="kpi-metrics-grid">
        {/* Total Queries */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-card-top">
            <div>
              <span className="kpi-metric-card-label">Total Queries</span>
              <h3 className="kpi-metric-card-value">{queriesCount}</h3>
            </div>
            <div className="kpi-metric-card-icon-container" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
              <Activity className="text-blue-400" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '12px' }}>
              <ArrowUpRight size={10} /> +14.8%
            </span>
            <span className="kpi-metric-card-footer" style={{ marginTop: 0 }}>vs last week</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-card-top">
            <div>
              <span className="kpi-metric-card-label">Average Latency</span>
              <h3 className="kpi-metric-card-value">{latencyCount.toFixed(2)}s</h3>
            </div>
            <div className="kpi-metric-card-icon-container" style={{ background: 'rgba(139, 92, 246, 0.08)' }}>
              <TrendingUp className="text-purple-400" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '12px' }}>
              <ArrowDownRight size={10} /> -5.2%
            </span>
            <span className="kpi-metric-card-footer" style={{ marginTop: 0 }}>vs baseline</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-card-top">
            <div>
              <span className="kpi-metric-card-label">Success Rate</span>
              <h3 className="kpi-metric-card-value">{successRateCount}%</h3>
            </div>
            <div className="kpi-metric-card-icon-container" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
              <CheckCircle2 className="text-emerald-400" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '12px' }}>
              <ArrowUpRight size={10} /> +0.5%
            </span>
            <span className="kpi-metric-card-footer" style={{ marginTop: 0 }}>perfect operations</span>
          </div>
        </div>

        {/* Executions */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-card-top">
            <div>
              <span className="kpi-metric-card-label">Tool calls</span>
              <h3 className="kpi-metric-card-value">{executionsCount}</h3>
            </div>
            <div className="kpi-metric-card-icon-container" style={{ background: 'rgba(236, 72, 153, 0.08)' }}>
              <Zap className="text-pink-400" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '12px' }}>
              <ArrowUpRight size={10} /> +24.1%
            </span>
            <span className="kpi-metric-card-footer" style={{ marginTop: 0 }}>active tools</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid-container">
        
        {/* Left SVG Donut: Tool Distribution */}
        <div className="chart-card-box">
          <div className="chart-card-header">
            <h4><PieChart size={14} className="text-purple-400" /> Tool Calls Share</h4>
            <span>Usage shares for each executed subsystem tool.</span>
          </div>

          <div className="donut-chart-flex">
            <div className="donut-svg-wrapper">
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {totalToolCalls === 0 ? (
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                ) : (
                  slices.map((slice, i) => (
                    <motion.path
                      key={i}
                      d={slice.pathData}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="11"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ transition: 'stroke-width 0.2s' }}
                    />
                  ))
                )}
              </svg>
              <div className="donut-svg-center-text">
                <span>TOTAL</span>
                <strong>{totalToolCalls}</strong>
              </div>
            </div>

            <div className="donut-legends-list">
              {slices.length === 0 ? (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No tool records logged.</span>
              ) : (
                slices.map((slice, i) => (
                  <div key={i} className="legend-item-row">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="legend-item-dot" style={{ backgroundColor: slice.color }} />
                      <span className="legend-item-title capitalize">{formatToolName(slice.name)}</span>
                    </div>
                    <span className="legend-item-percent">{slice.percent}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Line Chart: Latency trends */}
        <div className="chart-card-box">
          <div className="chart-card-header">
            <h4><Activity size={14} className="text-blue-400" /> Latency profile</h4>
            <span>Telemetry duration tracks of the latest calls.</span>
          </div>

          <div className="line-chart-svg-wrapper">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="latencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              
              {/* Latency Area */}
              {linePoints.length > 0 && (
                <motion.polygon 
                  points={areaString} 
                  fill="url(#latencyAreaGrad)" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              )}
              
              {/* Latency Line */}
              {linePoints.length > 0 && (
                <motion.polyline
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                  points={pointsString}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              )}
              
              {/* Dots */}
              {linePoints.map((p, idx) => {
                const x = (idx / (linePoints.length - 1)) * chartWidth;
                const val = p.duration || 0;
                const y = chartHeight - (val / maxVal) * chartHeight;
                return (
                  <motion.circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                  />
                );
              })}
            </svg>
          </div>
          
          <div className="line-chart-footer-labels">
            <span>Older calls</span>
            <span>Latest call</span>
          </div>
        </div>
      </div>

      {/* Recent executions log */}
      <div className="recent-activity-card">
        <h4><Activity size={14} className="text-emerald-400" /> Recent Ingestion Activity</h4>
        <div style={{ overflowX: 'auto' }}>
          {recentExecutions.length === 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No activity logs recorded.</span>
          ) : (
            <table className="recent-activity-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Subsystem Tool</th>
                  <th>Payload Input</th>
                  <th style={{ textAlign: 'right' }}>Executed At</th>
                </tr>
              </thead>
              <tbody>
                {recentExecutions.slice(0, 5).map((exec) => (
                  <tr key={exec.id}>
                    <td>
                      {exec.status === 'success' ? (
                        <span className="tool-badge" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--color-output)' }}>Success</span>
                      ) : (
                        <span className="tool-badge" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-error)' }}>Failure</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {formatToolName(exec.tool)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }}>
                      {exec.input}
                    </td>
                    <td style={{ color: 'var(--text-muted)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {new Date(exec.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
