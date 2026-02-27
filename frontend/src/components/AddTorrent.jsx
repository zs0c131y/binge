import { useState, useRef } from 'react';
import { api } from '../api.js';

export function AddTorrent({ onAdded }) {
  const [magnet,  setMagnet]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [drag,    setDrag]    = useState(false);
  const fileRef = useRef();

  async function handleAdd() {
    const m = magnet.trim();
    if (!m) return;
    setError(''); setLoading(true);
    try {
      const row = await api.addMagnet(m);
      setMagnet('');
      onAdded(row);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.torrent')) {
      setError('Only .torrent files are accepted');
      return;
    }
    setError(''); setLoading(true);
    try {
      const row = await api.addTorrentFile(file);
      onAdded(row);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div
      className={`add-panel glass-card${drag ? ' dragging' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      <div className="add-icon">⬇</div>
      <h2 className="add-title">Add Torrent</h2>
      <p className="add-sub">Paste a magnet link or drop a .torrent file</p>

      <div className="add-row">
        <input
          className="input"
          placeholder="magnet:?xt=urn:btih:…"
          value={magnet}
          onChange={e => setMagnet(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={loading || !magnet.trim()}
        >
          {loading ? '…' : 'Add'}
        </button>
      </div>

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => fileRef.current.click()}
        disabled={loading}
      >
        Upload .torrent file
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".torrent"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {error && <p className="error-text">{error}</p>}
      {drag  && <div className="drop-overlay">Drop .torrent file here</div>}
    </div>
  );
}
