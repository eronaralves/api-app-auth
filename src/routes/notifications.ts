import WebPush from "web-push"
import type { FastifyInstance } from 'fastify';
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middlewares/verify-jwt";
import { env } from "../env";

const publicKey = env.PUBLIC_KEY
const privateKey = env.PRIVATE_KEY

WebPush.setVapidDetails(
  env.BASE_URL,
  publicKey,
  privateKey,
)

export async function notificationsRoutes(app: FastifyInstance) {
  app.get('/public_key', async (request, reply) => {
    return reply.status(200).send({
      publicKey
    })
  })

  app.post('/register',{ preHandler: verifyJWT }, async (request, reply) => {
    const userId = request.user.sub
    const registerBodySchema = z.object({
      subscription: z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string()
        })
      })
    });

    const { subscription } = registerBodySchema.parse(request.body)

    console.log(subscription, 'FF')

    const notificationWithSameSubscription = await prisma.notifications.findUnique({
      where: { 
        auth: subscription.keys.auth,
      }
    })

    console.log(notificationWithSameSubscription, 'push')


    if(notificationWithSameSubscription) {
      return reply.status(200).send()
    }

    const data = await prisma.notifications.create({
      data: {
        user_id: userId,
        auth: subscription.keys.auth,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh
      }
    })

    console.log(data, 'DAAAAA')

    return reply.status(201).send()
  })
}
