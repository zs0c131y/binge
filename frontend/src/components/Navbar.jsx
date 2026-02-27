import { api } from '../api.js';

function fmtBytes(b) {
  if (!b || b === 0) return '0 B';
  const u = ['B','KB','MB','GB','TB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
  return `${(b / 1024 ** i).toFixed(1)} ${u[i]}`;
}

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
