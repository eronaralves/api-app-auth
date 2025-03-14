import type { FastifyInstance } from 'fastify';
import { verifyJWT } from '../middlewares/verify-jwt';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function meRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT);

  app.put('/', { preHandler: verifyJWT }, async (request, reply) => {
    const oAuthUserBodySchema = z.object({
      name: z.string().optional(),
      profile_url: z.string().optional(),
    });

    const bodyParse = oAuthUserBodySchema.parse(request.body);

    const { name, profile_url } = bodyParse;

    const userId = request.user.sub;

    const user = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(400).send({
        message: 'Usuário não encontrado!',
      });
    }

    const userUpdated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        profile_url,
      },
    });

    return reply.status(200).send({
      user: userUpdated,
    });
  });
}
