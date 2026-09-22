import React, { useState } from 'react';
import { Copy, Check, Download, Brain, FileText, BarChart, Percent, Clock, Star } from 'lucide-react';

export default function SummaryVisualizer({ summary }) {
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState('summary'); // summary, original

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.summary_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const fileContent = `TITLE: ${summary.title}\n` +
                        `DATE: ${new Date(summary.created_at).toLocaleString()}\n` +
                        `METHOD: ${summary.summary_type.toUpperCase()} (${summary.model_used})\n` +
                        `MODE: ${summary.summary_mode.toUpperCase()}\n` +
                        `LANGUAGE: ${summary.language}\n` +
                        `=========================================\n\n` +
                        `SUMMARY:\n${summary.summary_text}\n\n` +
                        `=========================================\n` +
                        `METRICS:\n` +
                        `- Reading Time Saved: ${summary.reading_time_reduction}%\n` +
                        `- Compression Ratio: ${summary.compression_ratio}\n` +
                        `- Flesch Readability: ${summary.readability_score}\n` +
                        `- Keywords: ${summary.keywords.join(', ')}`;
                        
    const file = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${summary.title.replace(/\s+/g, "_")}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getReadabilityLabel = (score) => {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Confusing';
  };

  const origWords = summary.original_text.split(/\s+/).filter(Boolean).length;
  const sumWords = summary.summary_text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Top row: Metrics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        
        {/* Reading Time Saved card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Saved</p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>{summary.reading_time_reduction}%</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Faster reading speed</p>
          </div>
        </div>

        {/* Compression Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
            <Percent size={24} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compression</p>
            <h3 style={{ fontSize: '24px', fontWeight: '800' }}>{Math.round(summary.compression_ratio * 100)}%</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sumWords} of {origWords} words</p>
          </div>
        </div>

        {/* Readability Score Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-secondary)' }}>
            <Star size={24} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Readability</p>
            <h3 style={{ fontSize: '24px', fontWeight: '800' }}>{summary.readability_score}</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getReadabilityLabel(summary.readability_score)}</p>
          </div>
        </div>

        {/* Model Identifier Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Brain size={24} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Engine</p>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '6px' }}>{summary.model_used.split("/").pop()}</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transformer parameters</p>
          </div>
        </div>

      </div>

      {/* Main visual panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Left Side: Summary output */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: '0px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--glass-border)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Summary Text</span>
            </h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={handleCopy}>
                {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={handleDownload}>
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            lineHeight: '1.8',
            fontSize: '15px',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line'
          }}>
            {summary.summary_text}
          </div>
        </div>

        {/* Right Side: Source text view with tabs/insights */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: '0px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--glass-border)'
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div
                onClick={() => setViewTab('summary')}
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: viewTab === 'summary' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: viewTab === 'summary' ? '2px solid var(--accent-primary)' : 'none',
                  paddingBottom: '4px'
                }}
              >
                Original Source
              </div>
              <div
                onClick={() => setViewTab('entities')}
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: viewTab === 'entities' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: viewTab === 'entities' ? '2px solid var(--accent-primary)' : 'none',
                  paddingBottom: '4px'
                }}
              >
                Entities ({summary.entities.length})
              </div>
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              LANGUAGE: {summary.language.toUpperCase()}
            </div>
          </div>

          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {viewTab === 'summary' && (
              <div style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'pre-line' }}>
                {summary.original_text}
              </div>
            )}

            {viewTab === 'entities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  The AI extracted the following key structural entities from the document:
                </p>
                {summary.entities.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No entities identified in this context.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {summary.entities.map((ent, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--glass-border)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{ent.text}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 
                            ent.label === 'PERSON' ? 'rgba(99, 102, 241, 0.15)' :
                            ent.label === 'ORG' ? 'rgba(168, 85, 247, 0.15)' :
                            ent.label === 'LOC' ? 'rgba(16, 185, 129, 0.15)' :
                            ent.label === 'DATE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                          color:
                            ent.label === 'PERSON' ? 'var(--accent-primary)' :
                            ent.label === 'ORG' ? 'var(--accent-secondary)' :
                            ent.label === 'LOC' ? 'var(--success)' :
                            ent.label === 'DATE' ? 'var(--warning)' : 'var(--text-secondary)'
                        }}>
                          {ent.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Keywords section */}
      <div className="glass-card">
        <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={16} style={{ color: 'var(--warning)' }} />
          <span>Extracted Keywords & Topic Tags</span>
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {summary.keywords.map((word, idx) => (
            <span
              key={idx}
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                color: 'var(--accent-primary)',
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}
            >
              #{word}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
