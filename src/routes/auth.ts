import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import bycrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';

export async function authRoutes(app: FastifyInstance) {
  app.post('/sign-in', async (request, reply) => {
    const signInUserBodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const bodyParse = signInUserBodySchema.safeParse(request.body);

    if (bodyParse.success === false) {
      return reply.status(400).send({
        message: 'email e senha são campos obrigatórios',
      });
    }

    const { password, email } = bodyParse.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        role: true,
        name: true,
        email: true,
        profile_url: true,
        password_hash: true,
        id: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        message: 'Credenciais inválidas',
      });
    }

    const doesPasswordMatches = await bycrypt.compare(
      password,
      user.password_hash ?? ''
    );

    if (!doesPasswordMatches) {
      return reply.status(401).send({
        message: 'Credenciais inválidas',
      });
    }

    const token = await reply.jwtSign(
      {
        role: user.role,
        name: user.name,
        email: user.email,
        profile_url: user.profile_url,
      },
      {
        sign: {
          sub: user.id,
        },
      }
    );

    return reply.status(200).send({
      token,
    });
  });

  app.post('/register', async (request, reply) => {
    const signInUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      // profile_url: z.string(),
      role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
    });

    const { email, name, password, role } =
      signInUserBodySchema.parse(request.body);

    const userWithSameEmail = await prisma.user.findFirst({ where: { email }});
    const password_hash = await bycrypt.hash(password, 6);

    if(userWithSameEmail) {
      if(userWithSameEmail.password_hash) {
        throw new AppError('Email já cadastrado', 400);
      }

      const user = await prisma.user.update({
        where: {
          id: userWithSameEmail.id
        },
        data: {
          password_hash,
        }
      });
      
      return reply.status(201).send({ user });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password_hash,
        profile_url: 'https://github.com/eronaralves.png',
        role,
      },
    });

    return reply.status(201).send({ user });
  });

  app.post('/oauth', async (request, reply) => {
    const oAuthUserBodySchema = z.object({
      email: z.string().email(),
      name: z.string(),
      provider: z.string(),
      profile_url: z.string(),
    });

    const bodyParse = oAuthUserBodySchema.parse(request.body);

    const { email, name, provider, profile_url } = bodyParse;

    try {
      const findUser = await prisma.user.findFirst({
        where: {
          email,
        },
        select: {
          email: true,
          name: true,
          id: true,
          role: true,
          profile_url: true,
        },
      });

      // check if there is already a registered user
      if (!findUser) {
        const user = await prisma.user.create({
          data: {
            email,
            name,
            profile_url,
          },
          select: {
            email: true,
            name: true,
            id: true,
            role: true,
            profile_url: true,
          },
        });

        await prisma.account.create({
          data: {
            userId: user.id,
            provider: provider,
          },
        });

        const token = await reply.jwtSign(
          {
            role: user.role,
            name: user.name,
            email: user.email,
            profile_url: user.profile_url,
          },
          {
            sign: {
              sub: user.id,
            },
          }
        );

        return reply.status(200).send({
          token,
        });
      }

      const findAccount = await prisma.account.findFirst({
        where: {
          userId: findUser.id,
          provider,
        },
      });

      // checks if the user already has an account with that provider
      if (!findAccount) {
        await prisma.account.create({
          data: {
            userId: findUser.id,
            provider: provider,
          },
        });
      }

      const token = await reply.jwtSign(
        {
          role: findUser.role,
          name: findUser.name,
          email: findUser.email,
          profile_url: findUser.profile_url,
        },
        {
          sign: {
            sub: findUser.id,
          },
        }
      );

      return reply.status(200).send({
        token,
      });
    } catch (error) {
      return reply.status(400).send({
        message: 'Erro ao criar conta',
      });
    }
  });
}
