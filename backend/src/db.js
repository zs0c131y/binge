import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';

const DOWNLOAD_PATH = process.env.DOWNLOAD_PATH || './data/downloads';
const DB_PATH = join(dirname(DOWNLOAD_PATH), 'binge.sqlite');

mkdirSync(DOWNLOAD_PATH, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS torrents (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    magnet      TEXT,
    status      TEXT NOT NULL DEFAULT 'downloading',
    progress    REAL NOT NULL DEFAULT 0,
    size        INTEGER NOT NULL DEFAULT 0,
    downloaded  INTEGER NOT NULL DEFAULT 0,
    speed       INTEGER NOT NULL DEFAULT 0,
    peers       INTEGER NOT NULL DEFAULT 0,
    path        TEXT,
    error       TEXT,
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    torrent_id  TEXT NOT NULL REFERENCES torrents(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    path        TEXT NOT NULL,
    size        INTEGER NOT NULL DEFAULT 0
  );
`);

const stmts = {
  all:          db.prepare('SELECT * FROM torrents ORDER BY created_at DESC'),
  get:          db.prepare('SELECT * FROM torrents WHERE id = ?'),
  insert:       db.prepare(`
    INSERT INTO torrents (id, name, magnet, status, progress, size, downloaded, speed, peers, path, created_at)
    VALUES (@id, @name, @magnet, @status, @progress, @size, @downloaded, @speed, @peers, @path, @created_at)
  `),
  delete:       db.prepare('DELETE FROM torrents WHERE id = ?'),
  allFiles:     db.prepare('SELECT * FROM files WHERE torrent_id = ? ORDER BY size DESC'),
  getFile:      db.prepare('SELECT * FROM files WHERE id = ?'),
  insertFile:   db.prepare('INSERT INTO files (torrent_id, name, path, size) VALUES (@torrent_id, @name, @path, @size)'),
};

export function getTorrents()       { return stmts.all.all(); }
export function getTorrent(id)      { return stmts.get.get(id); }
export function insertTorrent(t)    { return stmts.insert.run(t); }
export function deleteTorrent(id)   { return stmts.delete.run(id); }
export function getFiles(tid)       { return stmts.allFiles.all(tid); }
export function getFile(id)         { return stmts.getFile.get(id); }
export function insertFiles(files)  {
  const tx = db.transaction((fs) => fs.forEach(f => stmts.insertFile.run(f)));
  tx(files);
}
export function updateTorrent(id, fields) {
  const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE torrents SET ${sets} WHERE id = @id`).run({ ...fields, id });
}
