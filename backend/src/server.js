import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';

import authRoutes from './routes/auth.js';
import torrentRoutes from './routes/torrents.js';
import fileRoutes from './routes/files.js';
import eventRoutes from './routes/events.js';
import { requireAuth } from './middleware/auth.js';
import { resumeTorrents } from './torrent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEV = process.env.NODE_ENV !== 'production';

// Refuse to start in production without a real session secret
if (!DEV && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable must be set in production. Generate with: openssl rand -hex 32');
  process.exit(1);
}

const fastify = Fastify({ logger: DEV });

// ── Plugins ──────────────────────────────────────────────────────────────────

await fastify.register(fastifyCookie, {
  secret: process.env.SESSION_SECRET ?? 'binge-dev-secret-change-me',
});

await fastify.register(fastifyMultipart, {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max .torrent
});

await fastify.register(fastifyCors, {
  origin: DEV ? true : false,
  credentials: true,
});

// ── Public routes (no auth) ───────────────────────────────────────────────────

await fastify.register(authRoutes);

// ── Protected routes ──────────────────────────────────────────────────────────

await fastify.register(async (app) => {
  app.register(requireAuth);
  app.register(torrentRoutes);
  app.register(fileRoutes);
  app.register(eventRoutes);
});

// ── Serve React SPA (production) ──────────────────────────────────────────────

const FRONTEND_DIST = join(__dirname, '../../frontend/dist');
if (existsSync(FRONTEND_DIST)) {
  await fastify.register(fastifyStatic, {
    root: FRONTEND_DIST,
    prefix: '/',
  });
  fastify.setNotFoundHandler((_req, reply) => reply.sendFile('index.html'));
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3000', 10);

fastify.addHook('onReady', async () => {
  await resumeTorrents();
  console.log(`Binge ready — http://localhost:${PORT}`);
});

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { fastify.log.error(err); process.exit(1); }
});
