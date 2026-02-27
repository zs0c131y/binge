import { useState } from 'react';
import { api } from '../api.js';
import { FileList } from './FileList.jsx';

function fmtBytes(b) {
  if (!b || b === 0) return '0 B';
  const u = ['B','KB','MB','GB','TB'];
  const i = Math.min(Math.floor(Math.log(Math.max(b,1)) / Math.log(1024)), u.length - 1);
  return `${(b / 1024 ** i).toFixed(1)} ${u[i]}`;
}

function fmtSpeed(bps) {
  if (!bps || bps < 512) return null;
  return `↓ ${fmtBytes(bps)}/s`;
}

function fmtDate(ts) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

const BADGE = {
  downloading: 'badge-downloading',
  done:        'badge-done',
  error:       'badge-error',
  paused:      'badge-paused',
};

export function TorrentCard({ torrent: t, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteTorrent(t.id);
      onDeleted(t.id);
    } catch { setDeleting(false); }
  }

  const pct = Math.round((t.progress ?? 0) * 100);
  const speed = fmtSpeed(t.speed);

  return (
    <div className="torrent-card glass-card">
      <div className="t-header">
        <div className="t-info">
          <span className={`badge ${BADGE[t.status] ?? 'badge-paused'}`}>
            {t.status}
          </span>
          <h3 className="t-name" title={t.name}>{t.name}</h3>
          <span className="t-meta">
            {fmtBytes(t.size)}
            {' · '}
            {fmtDate(t.created_at)}
          </span>
        </div>

        <div className="t-actions">
          {t.status === 'done' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? 'Hide' : 'Files'}
            </button>
          )}
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>

      {t.status === 'downloading' && (
        <div className="progress-section">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-meta">
            <span>{pct}%</span>
            {speed   && <span>{speed}</span>}
            {t.peers > 0 && <span>{t.peers} peers</span>}
            <span>{fmtBytes(t.downloaded)} / {fmtBytes(t.size)}</span>
          </div>
        </div>
      )}

      {t.status === 'error' && (
        <p className="error-text" style={{ fontSize: 13 }}>
          {t.error ?? 'Unknown error'}
        </p>
      )}

      {expanded && t.status === 'done' && <FileList torrentId={t.id} />}
    </div>
  );
}
