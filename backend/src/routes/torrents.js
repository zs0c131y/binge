import { addTorrent, removeTorrent } from '../torrent.js';
import { getTorrents, getTorrent, deleteTorrent } from '../db.js';

export default async function torrentRoutes(fastify) {
  // POST /api/torrents — magnet link (JSON) or .torrent file (multipart)
  fastify.post('/api/torrents', async (request, reply) => {
    const ct = request.headers['content-type'] ?? '';

    if (ct.includes('multipart/form-data')) {
      const data = await request.file();
      if (!data) return reply.code(400).send({ error: 'No file uploaded' });
      if (!data.filename.endsWith('.torrent')) {
        return reply.code(400).send({ error: 'Only .torrent files accepted' });
      }
      const buffer = await data.toBuffer();
      try {
        const row = await addTorrent(buffer);
        return reply.code(201).send(row);
      } catch (e) {
        return reply.code(400).send({ error: e.message });
      }
    }

    const { magnet } = request.body ?? {};
    if (!magnet || !String(magnet).startsWith('magnet:')) {
      return reply.code(400).send({ error: 'Invalid magnet link' });
    }
    try {
      const row = await addTorrent(magnet);
      return reply.code(201).send(row);
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // GET /api/torrents
  fastify.get('/api/torrents', async () => getTorrents());

  // DELETE /api/torrents/:id — always deletes files from disk
  fastify.delete('/api/torrents/:id', async (request, reply) => {
    const { id } = request.params;
    if (!getTorrent(id)) return reply.code(404).send({ error: 'Not found' });
    await removeTorrent(id);
    deleteTorrent(id);
    return { ok: true };
  });
}
