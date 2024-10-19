import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { createGoalCompletion } from "../../functions/create-goal-completion";

export const createCompletionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/goal-completions', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        goalId: z.string(),
        createdAt: z.string().optional(), // Campo opcional para o `createdAt`
      }),
    },
  }, async (request, reply) => {
    const { goalId, createdAt } = request.body;
    const userId = request.user.userId;

    await createGoalCompletion({
      goalId,
      userId,
      createdAt, // Passa `createdAt` se disponível
    });

    return reply.send({ message: 'Conclusão registrada com sucesso!' });
  });
}
