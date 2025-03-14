import WebPush from "web-push"
import type { FastifyInstance } from 'fastify';
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middlewares/verify-jwt";
import 'dotenv/config'

const publicKey = 'BOJ7aqaCUY-Sfo1oF6kh7rmX1KvOZ95ympTF4ZwB98hDkvePBK9V3k5tMJqPDYadx3H8fu1yhXDXUMPaZF7e_UI'
const privateKey = 'zjvPhYopklhHQluMd8322Qu0SvmbvjLm-8AlYkUy2zw'

WebPush.setVapidDetails(
  process.env.BASE_URL!,
  publicKey,
  privateKey
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
    
    const notificationWithSameSubscription = await prisma.notifications.findFirst({
      where: { 
        auth: subscription.keys.auth
      }
    })

    if(notificationWithSameSubscription) {
      return reply.status(200).send()
    }

    await prisma.notifications.create({
      data: {
        userId,
        auth: subscription.keys.auth,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh
      }
    })

    return reply.status(201).send()
  })
}
