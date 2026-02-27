import { useState, useEffect, useCallback } from 'react';
import { Navbar }      from './Navbar.jsx';
import { AddTorrent }  from './AddTorrent.jsx';
import { TorrentCard } from './TorrentCard.jsx';
import { useSSE }      from '../hooks/useSSE.js';
import { api }         from '../api.js';

export function Dashboard({ onLogout }) {
  const [torrents, setTorrents] = useState([]);
  const [stats,    setStats]    = useState(null);

  useEffect(() => {
    api.getTorrents().then(setTorrents).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, []);

  const refreshStats = useCallback(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  useSSE(useCallback((event) => {
    switch (event.type) {
      case 'torrent:added':
        setTorrents(prev => {
          if (prev.find(t => t.id === event.payload.id)) return prev;
          return [event.payload, ...prev];
        });
        break;

      case 'torrent:progress':
        setTorrents(prev => prev.map(t =>
          t.id === event.payload.id ? { ...t, ...event.payload } : t
        ));
        break;

      case 'torrent:done':
        setTorrents(prev => prev.map(t =>
          t.id === event.payload.id
            ? { ...t, status: 'done', progress: 1, speed: 0 }
            : t
        ));
        refreshStats();
        break;

      case 'torrent:error':
        setTorrents(prev => prev.map(t =>
          t.id === event.payload.id
            ? { ...t, status: 'error', error: event.payload.error }
            : t
        ));
        break;

      case 'torrent:removed':
        setTorrents(prev => prev.filter(t => t.id !== event.payload.id));
        refreshStats();
        break;
    }
  }, [refreshStats]));

  function handleAdded(row) {
    setTorrents(prev => {
      if (prev.find(t => t.id === row.id)) return prev;
      return [row, ...prev];
    });
    refreshStats();
  }

  function handleDeleted(id) {
    setTorrents(prev => prev.filter(t => t.id !== id));
    refreshStats();
  }

  return (
    <div className="dashboard">
      <Navbar stats={stats} onLogout={onLogout} />
      <main className="dash-main">
        <AddTorrent onAdded={handleAdded} />

        <section className="torrent-list">
          {torrents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◆</div>
              <p>No torrents yet — add one above.</p>
            </div>
          ) : (
            torrents.map(t => (
              <TorrentCard key={t.id} torrent={t} onDeleted={handleDeleted} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}
