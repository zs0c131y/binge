import { useState, useEffect } from 'react';
import { api } from '../api.js';

function fmtBytes(b) {
  if (!b || b === 0) return '0 B';
  const u = ['B','KB','MB','GB','TB'];
  const i = Math.min(Math.floor(Math.log(Math.max(b,1)) / Math.log(1024)), u.length - 1);
  return `${(b / 1024 ** i).toFixed(1)} ${u[i]}`;
}

export function FileList({ torrentId }) {
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFiles(torrentId)
      .then(f => setFiles([...f].sort((a, b) => b.size - a.size)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [torrentId]);

  if (loading) return <p className="file-placeholder">Loading files…</p>;
  if (!files.length) return <p className="file-placeholder">No files found.</p>;

  return (
    <div className="file-list">
      {files.map(file => (
        <div key={file.id} className="file-row">
          <span className="file-name" title={file.name}>{file.name}</span>
          <span className="file-size">{fmtBytes(file.size)}</span>
          <a
            href={api.downloadUrl(file.id)}
            className="btn btn-primary btn-sm"
            download
          >
            ↓ Download
          </a>
        </div>
      ))}
    </div>
  );
}
