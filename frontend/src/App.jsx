import React, { useState, useEffect } from 'react';
import { Sparkles, History, BarChart3, LogOut, Sun, Moon, Database } from 'lucide-react';
import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [currentView, setCurrentView] = useState('summarizer'); // summarizer, history, analytics
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Initialize theme on load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLoginSuccess = (newToken, email) => {
    setToken(newToken);
    setUserEmail(email);
    localStorage.setItem('userEmail', email);
    setCurrentView('summarizer');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUserEmail('');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!token) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
        
        {/* Header bar without auth */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 40px',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--accent-glow)',
              padding: '10px',
              borderRadius: '12px',
              color: '#ffffff',
              boxShadow: '0 4px 14px var(--glass-glow)'
            }}>
              <Sparkles size={22} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-family-title)', letterSpacing: '-0.02em' }}>
              IntelliSummarize AI
            </span>
          </div>
          <button className="btn btn-secondary" onClick={toggleTheme} style={{ padding: '10px' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main style={{ padding: '40px 0' }}>
          <AuthView onLoginSuccess={handleLoginSuccess} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Background decorations */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel">
        {/* Brand logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{
            background: 'var(--accent-glow)',
            padding: '8px',
            borderRadius: '10px',
            color: '#ffffff',
            boxShadow: '0 4px 14px var(--glass-glow)'
          }}>
            <Sparkles size={20} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-family-title)', letterSpacing: '-0.02em' }}>
            IntelliSummarize AI
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1 }}>
          <div
            className={`nav-link ${currentView === 'summarizer' ? 'active' : ''}`}
            onClick={() => setCurrentView('summarizer')}
          >
            <Database size={18} />
            <span>Workspace</span>
          </div>
          <div
            className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentView('history')}
          >
            <History size={18} />
            <span>History Archive</span>
          </div>
          <div
            className={`nav-link ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </div>
        </nav>

        {/* Sidebar Footer actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          {/* User information badge */}
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Logged in as: <br />
            <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={toggleTheme} style={{ flex: 1, padding: '10px' }} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ flex: 1, padding: '10px', color: 'var(--danger)' }} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {currentView === 'summarizer' && <Dashboard token={token} />}
        {currentView === 'history' && <HistoryView token={token} />}
        {currentView === 'analytics' && <AnalyticsView token={token} />}
      </main>
    </div>
  );
}
