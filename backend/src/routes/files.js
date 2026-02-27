import { createReadStream, statSync, existsSync } from 'fs';
import { getFiles, getFile, getTorrents } from '../db.js';

export default async function fileRoutes(fastify) {
  // GET /api/torrents/:id/files
  fastify.get('/api/torrents/:id/files', async (request) => {
    return getFiles(request.params.id);
  });

  // GET /api/files/:id/download — stream file to browser
  fastify.get('/api/files/:id/download', async (request, reply) => {
    const file = getFile(parseInt(request.params.id, 10));
    if (!file) return reply.code(404).send({ error: 'File not found' });
    if (!existsSync(file.path)) return reply.code(404).send({ error: 'File missing from disk' });

    const { size } = statSync(file.path);
    const safeName = encodeURIComponent(file.name).replace(/%20/g, '+');

    reply.headers({
      'Content-Type':        'application/octet-stream',
      'Content-Length':      size,
      'Content-Disposition': `attachment; filename*=UTF-8''${safeName}`,
    });
    return reply.send(createReadStream(file.path));
  });

  // GET /api/stats
  fastify.get('/api/stats', async () => {
    const torrents = getTorrents();
    const active    = torrents.filter(t => t.status === 'downloading').length;
    const completed = torrents.filter(t => t.status === 'done').length;
    const diskUsed  = torrents.reduce((acc, t) => {
      return acc + (t.status === 'done' ? (t.size ?? 0) : (t.downloaded ?? 0));
    }, 0);
    return { active, completed, total: torrents.length, diskUsed };
  });
}
