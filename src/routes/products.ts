import type { FastifyInstance } from 'fastify';
import { verifyJWT } from '../middlewares/verify-jwt';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

import WebPush from "web-push"

export async function productRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT);

  app.get('/', { preHandler: verifyJWT }, async (request, reply) => {
    const { sub: userId, role } = request.user;

    const products = await prisma.product.findMany({
      where: role === 'ADMIN' ? {} : { user_id: userId },
      include: {
        user: role === 'ADMIN' ? true : false
      }
    });

    return reply.status(200).send({
      products,
    });
  });

  app.post(
    '/create-product',
    { preHandler: verifyJWT },
    async (request, reply) => {
      const { sub: userId, role } = request.user;

      const createProductSchema = z.object({
        title: z.string(),
        description: z.string(),
        image_url: z.string(),
        price: z.coerce.number(),
      });

      const bodyParse = createProductSchema.parse(request.body);

      const { title, description, image_url, price } = bodyParse;

      if(role === 'ADMIN') {
        return reply.status(400).send({
          message: 'role ADMIN não pode criar produtos'
        })
      }

      const product = await prisma.product.create({
        data: {
          title,
          description,
          image_url,
          price,
          user_id: userId,
        },
      });

      reply.status(201).send();

      setImmediate(async () => {
        const subscriptions = await prisma.notifications.findMany()
    
        for (const sub of subscriptions) {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            },
          }
    
          await WebPush.sendNotification(
            pushSubscription,
            JSON.stringify({
              body: `Nova atividade foi criada, Venha ver!`,
              url: `https://portal-do-aluno-web.vercel.app/conta/IA-IPS-N1-04-25/praticas/atividades/98194e5f-5015-40ac-a37e-25efdef9d4a6/modulo/f771cf28-7c5a-41b0-8715-70c56b4f6b34`,
            }),
          )
          
        }
      })
    }
  );
}
