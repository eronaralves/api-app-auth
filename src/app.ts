import fastify from 'fastify';

import { env } from './env';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';

// Routes
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { meRoutes } from './routes/me';
import { notificationsRoutes } from './routes/notifications';

export const app = fastify();

app.register(fastifyCors, {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
  sign: {
    expiresIn: '30m',
  },
});

app.register(fastifyCookie);

app.register(authRoutes, {
  prefix: '/auth',
});

app.register(meRoutes, {
  prefix: '/me',
});

app.register(productRoutes, {
  prefix: '/products',
});

app.register(notificationsRoutes, {
  prefix: '/push'
})
