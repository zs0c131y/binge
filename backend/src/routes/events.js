import { registerSSEClient } from '../torrent.js';

export default async function eventRoutes(fastify) {
  fastify.get('/api/events', (request, reply) => {
    // Take control of the raw socket — Fastify won't manage this response
    reply.hijack();

    reply.raw.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    reply.raw.write('data: {"type":"connected"}\n\n');

    registerSSEClient(reply);

    // Keep-alive ping every 25s to prevent proxy timeouts
    const ping = setInterval(() => {
      try { reply.raw.write(': ping\n\n'); }
      catch { clearInterval(ping); }
    }, 25_000);

    request.raw.on('close', () => clearInterval(ping));
  });
}
