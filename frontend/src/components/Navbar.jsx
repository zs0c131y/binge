import { api } from '../api.js';
import { fmtBytes } from '../utils.js';

export function Navbar({ stats, onLogout }) {
  async function handleLogout() {
    try { await api.logout(); } catch { /* ignore */ }
    onLogout();
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="logo-diamond" style={{ fontSize: 20 }}>◆</span>
        <span className="logo-text" style={{ fontSize: 18, letterSpacing: 3 }}>BINGE</span>
      </div>

      {stats && (
        <div className="navbar-stats">
          <span className="stat-chip active">↓ {stats.active} active</span>
          <span className="stat-chip done">✓ {stats.completed} done</span>
          <span className="stat-chip size">{fmtBytes(stats.diskUsed)}</span>
        </div>
      )}

      <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}
