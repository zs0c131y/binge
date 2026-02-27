export function requireAuth(fastify, _opts, done) {
  fastify.addHook('preHandler', (request, reply, next) => {
    const cookie = request.unsignCookie(request.cookies.binge_auth ?? '');
    if (cookie.valid && cookie.value === '1') return next();
    reply.code(401).send({ error: 'Unauthorized' });
  });
  done();
}
