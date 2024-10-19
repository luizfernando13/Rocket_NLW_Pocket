import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { hash } from 'bcrypt';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerRoute: FastifyPluginAsync = async (app) => {
  app.post('/register', {
    schema: {
      body: registerSchema,
    },
  }, async (request, reply) => {
    const { email, password } = request.body as z.infer<typeof registerSchema>;

    try {
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existingUser.length > 0) {
        return reply.status(400).send({ message: 'E-mail já está em uso' });
      }

      const passwordHash = await hash(password, 10);

      const [user] = await db.insert(users).values({
        email,
        passwordHash,
      }).returning();

      const token = app.jwt.sign(
        { userId: user.id },
        { expiresIn: '7d' } // Define o tempo de expiração para 7 dias
      );

      return reply.send({ token });
    } catch (error) {
      console.error('Erro ao registrar:', error);
      return reply.status(500).send({ message: 'Erro interno no servidor' });
    }
  });
};
