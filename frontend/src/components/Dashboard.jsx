import React, { useState, useRef } from 'react';
import { Upload, Link, FileText, Settings, Sparkles, RefreshCw } from 'lucide-react';
import SummaryVisualizer from './SummaryVisualizer';

export default function Dashboard({ token }) {
  const [activeTab, setActiveTab] = useState('text'); // text, file, url
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  
  // Settings state
  const [mode, setMode] = useState('detailed');
  const [type, setType] = useState('abstractive');
  const [language, setLanguage] = useState('English');
  const [ratio, setRatio] = useState(0.25);
  
  const [summaryResult, setSummaryResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const API_URL = 'http://localhost:8000/api';

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSummarize = async () => {
    setError('');
    setLoading(true);
    setSummaryResult(null);
    setProgressMsg('Parsing document...');

    try {
      let response;
      const headers = { 'Authorization': `Bearer ${token}` };

      if (activeTab === 'text' || activeTab === 'url') {
        if (activeTab === 'text' && !text.trim()) {
          throw new Error('Please enter some text to summarize.');
        }
        if (activeTab === 'url' && !url.trim()) {
          throw new Error('Please enter a valid URL.');
        }

        setProgressMsg('Loading AI model and running pipeline...');
        response = await fetch(`${API_URL}/summarize/text`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: activeTab === 'text' ? text : null,
            url: activeTab === 'url' ? url : null,
            mode,
            type,
            language,
            length_ratio: ratio
          })
        });
      } else {
        if (!file) {
          throw new Error('Please upload a document to proceed.');
        }

        setProgressMsg('Uploading file...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        formData.append('type', type);
        formData.append('language', language);
        formData.append('length_ratio', ratio.toString());

        setProgressMsg('Extracting text and running summarizer engine...');
        response = await fetch(`${API_URL}/summarize/file`, {
          method: 'POST',
          headers,
          body: formData
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Summarization failed. Please verify the input.');
      }

      setSummaryResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const handleReset = () => {
    setSummaryResult(null);
    setText('');
    setUrl('');
    setFile(null);
    setError('');
  };

  if (summaryResult) {
    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Summary Generated</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Analysis of: {summaryResult.title}</p>
          </div>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RefreshCw size={16} />
            <span>Summarize Another Document</span>
          </button>
        </div>
        <SummaryVisualizer summary={summaryResult} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Summarization Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Generate clean, contextual summaries using advanced extractive and abstractive NLP transformers.</p>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '24px',
          color: var(--danger),
          color: '#ef4444'
        }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Side: Document Inputs */}
        <div>
          <div className="glass-card" style={{ padding: '0px', overflow: 'visible' }}>
            {/* Input Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--glass-border)',
              padding: '10px 24px 0 24px'
            }}>
              <div
                className={`nav-link ${activeTab === 'text' ? 'active' : ''}`}
                style={{ borderBottom: activeTab === 'text' ? '2px solid var(--accent-primary)' : 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, paddingBottom: '16px' }}
                onClick={() => setActiveTab('text')}
              >
                <FileText size={18} />
                <span>Raw Text</span>
              </div>
              <div
                className={`nav-link ${activeTab === 'file' ? 'active' : ''}`}
                style={{ borderBottom: activeTab === 'file' ? '2px solid var(--accent-primary)' : 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, paddingBottom: '16px' }}
                onClick={() => setActiveTab('file')}
              >
                <Upload size={18} />
                <span>File Upload</span>
              </div>
              <div
                className={`nav-link ${activeTab === 'url' ? 'active' : ''}`}
                style={{ borderBottom: activeTab === 'url' ? '2px solid var(--accent-primary)' : 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, paddingBottom: '16px' }}
                onClick={() => setActiveTab('url')}
              >
                <Link size={18} />
                <span>Web URL</span>
              </div>
            </div>

            {/* Input Form Containers */}
            <div style={{ padding: '32px' }}>
              {activeTab === 'text' && (
                <div className="form-group" style={{ marginBottom: '0px' }}>
                  <label className="form-label">Input Text</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: '300px', resize: 'vertical', lineHeight: '1.6' }}
                    placeholder="Paste or write your document content here (minimum 20 characters)..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {text.split(/\s+/).filter(Boolean).length} words | {text.length} characters
                  </div>
                </div>
              )}

              {activeTab === 'file' && (
                <div>
                  <div
                    className={`upload-zone ${dragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    style={{ minHeight: '300px' }}
                  >
                    <Upload size={48} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Drag & Drop file here</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Supports PDF, DOCX, or TXT (Max 10MB)
                    </p>
                    <button className="btn btn-secondary" style={{ marginTop: '8px' }} type="button">
                      Browse Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".txt,.pdf,.docx"
                      style={{ display: 'none' }}
                    />
                  </div>

                  {file && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--glass-border)'
                    }}>
                      <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setFile(null)}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'url' && (
                <div className="form-group" style={{ marginBottom: '0px' }}>
                  <label className="form-label">Article URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/blog-post-or-news-article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Enter any public article, paper, or blog URL. Our system will extract the core textual contents for summarization.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Process Parameters */}
        <div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Engine Settings</h3>
            </div>

            {/* Model Type */}
            <div className="form-group">
              <label className="form-label">Summarization Method</label>
              <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="abstractive">Abstractive (AI Generative)</option>
                <option value="extractive">Extractive (Sentence Ranking)</option>
                <option value="hybrid">Hybrid (Sentence Rank + AI)</option>
                <option value="rag">RAG Pipeline (Large Docs)</option>
              </select>
            </div>

            {/* Formatting Mode */}
            <div className="form-group">
              <label className="form-label">Summary Mode</label>
              <select className="form-control" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="detailed">Detailed Summary</option>
                <option value="short">Short Overview</option>
                <option value="bullet">Bullet Points List</option>
                <option value="executive">Executive Summary</option>
                <option value="academic">Academic Abstract</option>
                <option value="meeting">Meeting Brief & Tasks</option>
                <option value="news">News Digest Format</option>
              </select>
            </div>

            {/* Language */}
            <div className="form-group">
              <label className="form-label">Target Language</label>
              <select className="form-control" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Arabic">Arabic (العربية)</option>
              </select>
            </div>

            {/* Summary Length ratio */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: '0px' }}>Summary Length</label>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-primary)' }}>{Math.round(ratio * 100)}%</span>
              </div>
              <div className="slider-container">
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={ratio}
                  onChange={(e) => setRatio(parseFloat(e.target.value))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Short (10%)</span>
                <span>Long (80%)</span>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleSummarize}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="pulse-glow" size={18} style={{ animation: 'spin 2s linear infinite' }} />
                  <span className="pulse-glow">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Execute Summarize</span>
                </>
              )}
            </button>

            {loading && progressMsg && (
              <p style={{
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--accent-primary)',
                fontWeight: '500',
                marginTop: '-12px'
              }} className="pulse-glow">
                {progressMsg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
