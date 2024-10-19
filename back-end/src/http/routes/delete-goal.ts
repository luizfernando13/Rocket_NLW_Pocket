// back-end\src\http\routes\delete-goal.ts

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { deleteGoal } from "../../functions/delete-goal";

export const deleteGoalRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/delete-goal', {
    preHandler: [app.authenticate], // Protege a rota
    schema: {
      body: z.object({
        goalId: z.string(),
      }),
    },
  }, async (request, reply) => {
    const { goalId } = request.body;
    const userId = request.user.userId; // Obtém o userId

    await deleteGoal({ goalId, userId });

    return reply.send({ message: 'Meta excluída com sucesso!' });
  });
}
