import { useState } from 'react';
import { api } from '../api.js';

export function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(password);
      onLogin();
    } catch {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-bg" />
      <form className="login-card glass-card" onSubmit={handleSubmit} autoComplete="off">
        <div className="login-logo">
          <span className="logo-diamond">◆</span>
          <span className="logo-text">BINGE</span>
        </div>
        <p className="login-sub">Your personal torrent cloud</p>

        <input
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
        />

        {error && <p className="error-text">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !password}
          style={{ width: '100%', padding: '13px' }}
        >
          {loading ? 'Entering…' : 'Enter Binge'}
        </button>
      </form>
    </div>
  );
}
