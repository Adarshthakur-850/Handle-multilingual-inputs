import React, { useState, useEffect } from 'react';
import { Search, Trash2, Calendar, FileText, ChevronRight, Eye, CornerDownRight } from 'lucide-react';
import SummaryVisualizer from './SummaryVisualizer';

export default function HistoryView({ token }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Expanded summary selection
  const [selectedSummary, setSelectedSummary] = useState(null);

  const API_URL = 'http://localhost:8000/api';

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${API_URL}/history/${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch history.');
      }
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search]);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Stop expand card trigger
    if (!window.confirm('Are you sure you want to delete this summary?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete summary.');
      }

      setHistory(history.filter(item => item.id !== id));
      if (selectedSummary && selectedSummary.id === id) {
        setSelectedSummary(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>History & Archive</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Browse, review, and export previously generated summaries.</p>
      </div>

      {selectedSummary ? (
        <div>
          <button
            className="btn btn-secondary"
            style={{ marginBottom: '24px' }}
            onClick={() => setSelectedSummary(null)}
          >
            ← Back to Archive list
          </button>
          
          <div className="glass-card" style={{ marginBottom: '24px', padding: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{selectedSummary.title}</h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Created on: {new Date(selectedSummary.created_at).toLocaleString()}</span>
              <span>•</span>
              <span>Method: {selectedSummary.summary_type}</span>
              <span>•</span>
              <span>Language: {selectedSummary.language}</span>
            </div>
          </div>
          
          <SummaryVisualizer summary={selectedSummary} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Search bar */}
          <div className="glass-card" style={{ padding: '16px 24px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '44px' }}
                placeholder="Search archive summaries by document title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="pulse-glow" style={{ fontSize: '16px', color: 'var(--accent-primary)', fontWeight: '600' }}>
                Fetching your archive summaries...
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
              Error: {error}
            </div>
          ) : history.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
              <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No Summaries Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
                {search ? 'No results matched your search term.' : 'You have not generated any summaries yet. Go to the dashboard to start.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  className="glass-card"
                  onClick={() => setSelectedSummary(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--accent-primary)'
                    }}>
                      <FileText size={22} />
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                        {item.title}
                      </h3>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>Ratio: {Math.round(item.compression_ratio * 100)}%</span>
                        <span>•</span>
                        <span style={{
                          textTransform: 'uppercase',
                          fontWeight: '700',
                          fontSize: '10px',
                          color: 'var(--accent-primary)',
                          backgroundColor: 'rgba(99, 102, 241, 0.08)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {item.summary_type}
                        </span>
                        <span>•</span>
                        <span>Lang: {item.language}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '24px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => handleDelete(item.id, e)}
                      style={{
                        padding: '8px 10px',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.15)',
                        backgroundColor: 'rgba(239, 68, 68, 0.02)'
                      }}
                      title="Delete entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
