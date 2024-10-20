import fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import fastifyCors from "@fastify/cors";
import fastifyJwt from '@fastify/jwt';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createGoalRoute } from "./routes/create-goal";
import { createCompletionRoute } from "./routes/create-completion";
import { getPendingGoalsRoute } from "./routes/get-pending-goals";
import { getWeekSummaryRoute } from "./routes/get-week-summary";
import { undoCompletionRoute } from "./routes/undo-completion";
import { deleteGoalRoute } from "./routes/delete-goal";
import { registerRoute } from "./routes/register";
import { loginRoute } from "./routes/login";

import { env } from '../env';
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

// Defina a interface para o payload do JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string };
    user: {
      userId: string;
    };
  }
}

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: (origin, cb) => {
    if (!origin) {
      // Permitir requisições sem origem (como chamadas de servidores internos)
      cb(null, true);
      return;
    }

    // Permitir nlwpocket.vercel.app e localhost (ambos com e sem porta)
    if (/nlwpocket\.vercel\.app/.test(origin) || /localhost(:\d+)?/.test(origin)) {
      cb(null, true); // Permite requisições desses domínios
    } else {
      cb(new Error('Not allowed by CORS'), false); // Bloqueia requisições de outras origens
    }
  },
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: '7d', // Define o tempo de expiração para 7 dias
  },
});

app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = await request.jwtVerify<{ userId: string }>();
    
    // Verifica se o user_id ainda existe no banco de dados
    const userExists = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (!userExists.length) {
      reply.code(401).send({ message: 'Usuário não encontrado. Por favor, faça login novamente.' });
    }

  } catch (err) {
    reply.send(err);
  }
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Rotas públicas
app.register(registerRoute);
app.register(loginRoute);

// Rotas protegidas
app.register(async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.register(createGoalRoute);
  app.register(createCompletionRoute);
  app.register(getPendingGoalsRoute);
  app.register(getWeekSummaryRoute);
  app.register(undoCompletionRoute);
  app.register(deleteGoalRoute);
});

app.listen({
  port: env.PORT,
  host: '0.0.0.0',
}).then(() => {
  console.log(`Server running on port ${env.PORT}!!! 🚀`);
});
