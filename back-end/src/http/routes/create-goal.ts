import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { createGoal } from "../../functions/create-goal";

export const createGoalRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/goals', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().int().min(1).max(7),
      }),
    }
  }, async (request, reply) => {
    const { title, desiredWeeklyFrequency } = request.body;
    const userId = request.user.userId; // Obtém o userId do token JWT

    console.log('Requisição recebida no back-end:', title, desiredWeeklyFrequency, userId);

    try {
      // Chama a função de criação da meta com o userId
      await createGoal({ title, desiredWeeklyFrequency, userId });
      return reply.status(201).send({ message: 'Meta criada com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar a meta:', error);
      return reply.status(500).send({ message: 'Erro ao criar a meta' });
    }
  });
};
