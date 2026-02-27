import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify) {
  fastify.post('/api/auth', async (request, reply) => {
    const { password } = request.body ?? {};
    if (!password) return reply.code(400).send({ error: 'Password required' });

    const plain = process.env.BINGE_PASSWORD ?? 'changeme';
    const valid = plain.startsWith('$2')
      ? await bcrypt.compare(password, plain)
      : password === plain;

    if (!valid) return reply.code(401).send({ error: 'Invalid password' });

    reply.setCookie('binge_auth', '1', {
      signed: true,
      httpOnly: true,
      path: '/',
      maxAge: 86400 * 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { ok: true };
  });

  fastify.delete('/api/auth', async (request, reply) => {
    reply.clearCookie('binge_auth', { path: '/' });
    return { ok: true };
  });
}
