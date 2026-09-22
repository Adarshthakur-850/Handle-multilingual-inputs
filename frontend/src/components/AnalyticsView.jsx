import React, { useState, useEffect } from 'react';
import { BarChart2, Hash, FileText, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';

export default function AnalyticsView({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_URL}/analytics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.detail || 'Failed to fetch analytics.');
        }
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }} className="pulse-glow">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-primary)' }}>Loading analytics workspace...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--danger)' }}>
        Error loading analytics: {error}
      </div>
    );
  }

  // Fallback safe rendering computations
  const totalSummaries = data?.total_summaries ?? 0;
  const totalWords = data?.total_words_processed ?? 0;
  const avgComp = data?.average_compression ?? 0;
  const timeSaved = data?.time_saved_minutes ?? 0;
  
  const activity = data?.activity ?? [];
  const languages = data?.languages ?? [];
  const methods = data?.methods ?? [];

  // Calculate stats for custom SVG bar chart
  const maxActivityCount = Math.max(...activity.map(a => a.count), 1);
  const svgHeight = 220;
  const svgWidth = 560;
  const barPadding = 24;
  const chartHeight = svgHeight - 40;
  const barWidth = (svgWidth - (barPadding * (activity.length + 1))) / activity.length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Performance & Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Detailed report on document optimization throughput, reading time saved, and model selections.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        
        {/* Total Summaries */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Tasks</span>
            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800' }}>{totalSummaries}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Documents compressed</p>
        </div>

        {/* Total Words */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Words Processed</span>
            <Hash size={20} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800' }}>{totalWords.toLocaleString()}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Source vocabulary length</p>
        </div>

        {/* Compression Efficiency */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Avg Compression</span>
            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--success)' }}>
            {totalSummaries > 0 ? `${Math.round(avgComp * 100)}%` : '0%'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Average summary output size</p>
        </div>

        {/* Time Saved */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reading Time Saved</span>
            <CheckCircle2 size={20} style={{ color: 'var(--warning)' }} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--warning)' }}>{timeSaved} <span style={{ fontSize: '16px', fontWeight: '600' }}>mins</span></h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Efficiency metrics saved</p>
        </div>

      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        
        {/* Weekly Activity (Custom SVG Bar Chart) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Weekly Processing Load</span>
          </h3>

          {totalSummaries === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center', minHeight: '220px', color: 'var(--text-muted)' }}>
              No processing data available to display.
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = 20 + chartHeight * (1 - ratio);
                  return (
                    <g key={index}>
                      <line
                        x1="20"
                        y1={y}
                        x2={svgWidth - 10}
                        y2={y}
                        stroke="var(--glass-border)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="5"
                        y={y + 4}
                        fill="var(--text-muted)"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="end"
                      >
                        {Math.round(maxActivityCount * ratio)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {activity.map((day, idx) => {
                  const x = barPadding + idx * (barWidth + barPadding);
                  const activeHeight = (day.count / maxActivityCount) * chartHeight;
                  const y = 20 + chartHeight - activeHeight;
                  
                  return (
                    <g key={idx} className="bar-group" style={{ cursor: 'pointer' }}>
                      {/* Bar Fill */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={activeHeight}
                        rx="4"
                        fill="url(#barGradient)"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      
                      {/* Interactive hover circle/text */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        fill="var(--text-primary)"
                        fontSize="11"
                        fontWeight="700"
                        textAnchor="middle"
                        opacity={day.count > 0 ? 1 : 0}
                      >
                        {day.count}
                      </text>

                      {/* X Axis Date labels */}
                      <text
                        x={x + barWidth / 2}
                        y={svgHeight - 10}
                        fill="var(--text-secondary)"
                        fontSize="10"
                        fontWeight="500"
                        textAnchor="middle"
                      >
                        {day.date.split('-').slice(1).join('/')}
                      </text>
                    </g>
                  );
                })}

                {/* Definitions for Gradients */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" />
                    <stop offset="100%" stopColor="var(--accent-secondary)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>

        {/* Distributions (Languages & Methods) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Languages Distribution */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Languages Used</h3>
            {languages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>No language distribution data.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {languages.map((lang, idx) => {
                  const pct = Math.round((lang.value / totalSummaries) * 100);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: '600' }}>
                        <span>{lang.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang.value} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'var(--accent-glow)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Methods Distribution */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Model Algorithms</h3>
            {methods.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>No model pipeline usage statistics.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {methods.map((meth, idx) => {
                  const pct = Math.round((meth.value / totalSummaries) * 100);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: '600' }}>
                        <span>{meth.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{meth.value} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: idx === 0 ? 'var(--accent-primary)' : idx === 1 ? 'var(--accent-secondary)' : 'var(--success)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
