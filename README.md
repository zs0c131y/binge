# Binge

Self-hosted cloud torrent service. Paste a magnet link or upload a `.torrent` file — files download server-side and are available for direct browser download.

## Quick Start

```bash
cp .env.example .env
# Edit .env — set BINGE_PASSWORD and SESSION_SECRET
docker compose up -d
```

Open http://localhost:3000

## Configuration

| Variable | Default | Description |
|---|---|---|
| `BINGE_PASSWORD` | *(required)* | Password to access the UI |
| `SESSION_SECRET` | *(required)* | Secret for signing cookies — use a long random string (`openssl rand -hex 32`) |
| `DOWNLOAD_PATH` | `/data/downloads` | Where torrent files are saved |
| `PORT` | `3000` | HTTP port |

## Development

```bash
# Terminal 1 — backend
cd backend && npm install
BINGE_PASSWORD=test SESSION_SECRET=dev DOWNLOAD_PATH=./data/downloads npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Frontend dev server: http://localhost:5173 (proxies /api to :3000)

## Features

- Paste magnet links or upload `.torrent` files
- Real-time download progress via Server-Sent Events
- File browser per torrent with direct download links
- Delete torrent and all files in one click
- Single-password protection
- Resumes in-progress torrents after server restart
- Docker deployment with persistent volume
