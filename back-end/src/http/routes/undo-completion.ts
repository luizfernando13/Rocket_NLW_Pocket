// back-end\src\http\routes\undo-completion.ts

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { undoGoalCompletion } from "../../functions/delete-goal-completion";

export const undoCompletionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/goal-completion-undo', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        goalId: z.string(),
      }),
    },
  }, async (request, reply) => {
    const { goalId } = request.body;
    const userId = request.user.userId;

    await undoGoalCompletion({ goalId, userId });

    return reply.send({ message: 'Conclusão desfeita com sucesso!' });
  });
}