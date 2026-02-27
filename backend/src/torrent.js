import WebTorrent from 'webtorrent';
import { rm, mkdirSync } from 'fs';
import { join } from 'path';
import {
  getTorrents, getTorrent, insertTorrent,
  updateTorrent, insertFiles,
} from './db.js';

const DOWNLOAD_PATH = process.env.DOWNLOAD_PATH ?? './data/downloads';
mkdirSync(DOWNLOAD_PATH, { recursive: true });

const client = new WebTorrent();
const sseClients = new Set();

client.on('error', (err) => console.error('[webtorrent]', err.message));

// ── SSE broadcasting ─────────────────────────────────────────────────────────

export function registerSSEClient(reply) {
  sseClients.add(reply);
  reply.raw.on('close', () => sseClients.delete(reply));
}

export function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const r of sseClients) {
    try { r.raw.write(data); } catch { sseClients.delete(r); }
  }
}

// ── Add torrent ───────────────────────────────────────────────────────────────

export function addTorrent(magnetOrBuffer) {
  return new Promise((resolve, reject) => {
    const opts = { path: DOWNLOAD_PATH };

    client.add(magnetOrBuffer, opts, (torrent) => {
      const row = {
        id:          torrent.infoHash,
        name:        torrent.name || 'Unknown',
        magnet:      typeof magnetOrBuffer === 'string' ? magnetOrBuffer : null,
        status:      'downloading',
        progress:    0,
        size:        torrent.length ?? 0,
        downloaded:  0,
        speed:       0,
        peers:       0,
        path:        join(DOWNLOAD_PATH, torrent.name),
        created_at:  Date.now(),
      };

      try {
        insertTorrent(row);
      } catch (e) {
        if (e.message.includes('UNIQUE constraint')) {
          torrent.destroy();
          return reject(new Error('Torrent already added'));
        }
        return reject(e);
      }

      broadcast({ type: 'torrent:added', payload: row });
      resolve(row);

      // Throttled progress updates
      let lastUpdate = 0;
      torrent.on('download', () => {
        const now = Date.now();
        if (now - lastUpdate < 1000) return;
        lastUpdate = now;
        const update = {
          id:         torrent.infoHash,
          progress:   torrent.progress,
          speed:      torrent.downloadSpeed,
          peers:      torrent.numPeers,
          downloaded: torrent.downloaded,
          size:       torrent.length,
        };
        updateTorrent(torrent.infoHash, { ...update, status: 'downloading' });
        broadcast({ type: 'torrent:progress', payload: update });
      });

      torrent.on('done', () => {
        const files = torrent.files.map(f => ({
          torrent_id: torrent.infoHash,
          name:       f.name,
          path:       f.path,
          size:       f.length,
        }));
        insertFiles(files);
        updateTorrent(torrent.infoHash, {
          status: 'done', progress: 1,
          downloaded: torrent.length, speed: 0,
        });
        broadcast({ type: 'torrent:done', payload: { id: torrent.infoHash } });
      });

      torrent.on('error', (err) => {
        updateTorrent(torrent.infoHash, { status: 'error', error: err.message });
        broadcast({ type: 'torrent:error', payload: { id: torrent.infoHash, error: err.message } });
      });
    });
  });
}

// ── Remove torrent + delete files from disk ───────────────────────────────────

export async function removeTorrent(infoHash) {
  const row = getTorrent(infoHash);

  // Destroy webtorrent instance if active
  const torrent = client.get(infoHash);
  if (torrent) {
    await new Promise(res => torrent.destroy({}, res));
  }

  // Always delete files from disk
  if (row?.path) {
    await new Promise(res => rm(row.path, { recursive: true, force: true }, res));
  }

  broadcast({ type: 'torrent:removed', payload: { id: infoHash } });
}

// ── Resume downloading torrents after server restart ─────────────────────────

export async function resumeTorrents() {
  const torrents = getTorrents().filter(t => t.status === 'downloading' && t.magnet);
  for (const t of torrents) {
    try {
      if (!client.get(t.id)) {
        await addTorrent(t.magnet);
      }
    } catch (e) {
      updateTorrent(t.id, { status: 'error', error: `Resume failed: ${e.message}` });
    }
  }
}
