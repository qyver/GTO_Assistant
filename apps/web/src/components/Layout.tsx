import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/telegram';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/gto', label: 'GTO', icon: '🎯' },
    { path: '/analyze', label: 'Analyze', icon: '🔍' },
    { path: '/training', label: 'Train', icon: '💪' },
    { path: '/equity', label: 'Equity', icon: '⚖️' },
  ];

  const handleTabClick = (path: string) => {
    haptic.light();
    navigate(path);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <main style={{ paddingBottom: 72 }}>
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className={`nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
