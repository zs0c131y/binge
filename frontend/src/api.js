async function req(method, path, body, isForm = false) {
  const opts = {
    method,
    credentials: 'include',
    headers: isForm ? {} : (body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  };
  const res = await fetch(path, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = Object.assign(new Error(json.error ?? `HTTP ${res.status}`), { status: res.status });
    throw err;
  }
  return json;
}

export const api = {
  login:           (password)  => req('POST',   '/api/auth',                  { password }),
  logout:          ()          => req('DELETE',  '/api/auth'),
  getTorrents:     ()          => req('GET',     '/api/torrents'),
  addMagnet:       (magnet)    => req('POST',    '/api/torrents',              { magnet }),
  addTorrentFile:  (file)      => { const f = new FormData(); f.append('torrent', file); return req('POST', '/api/torrents', f, true); },
  deleteTorrent:   (id)        => req('DELETE',  `/api/torrents/${id}`),
  getFiles:        (tid)       => req('GET',     `/api/torrents/${tid}/files`),
  getStats:        ()          => req('GET',     '/api/stats'),
  downloadUrl:     (fileId)    => `/api/files/${fileId}/download`,
};
