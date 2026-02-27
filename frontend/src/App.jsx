import { useState, useEffect } from 'react';
import { Login }     from './components/Login.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { api }       from './api.js';

export default function App() {
  // null = checking, true = authed, false = not authed
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    api.getTorrents()
      .then(() => setAuthed(true))
      .catch(e => setAuthed(e.status === 401 ? false : false));
  }, []);

  if (authed === null) {
    return (
      <div className="loading-screen">
        <span>Loading…</span>
      </div>
    );
  }

  return authed
    ? <Dashboard onLogout={() => setAuthed(false)} />
    : <Login onLogin={() => setAuthed(true)} />;
}
