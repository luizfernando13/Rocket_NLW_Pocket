import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { compare } from 'bcrypt';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const loginRoute: FastifyPluginAsync = async (app) => {
  app.post('/login', {
    schema: {
      body: loginSchema,
    },
  }, async (request, reply) => {
    const { email, password } = request.body as z.infer<typeof loginSchema>;

    try {
      // Verifica se o e-mail existe no banco de dados
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        // Retorna mensagem para registro se o e-mail não for encontrado
        return reply.status(400).send({ message: 'Usuário não encontrado. Por favor, registre-se.' });
      }

      // Verifica se a senha está correta
      const isPasswordValid = await compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return reply.status(400).send({ message: 'Credenciais inválidas. Verifique sua senha.' });
      }

      const token = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      return reply.send({ token });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return reply.status(500).send({ message: 'Erro interno no servidor' });
    }
  });
};
