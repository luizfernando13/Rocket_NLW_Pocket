// back-end\src\http\routes\get-pending-goals.ts

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getWeekPendingGoals } from "../../functions/get-week-pending-goals";

export const getPendingGoalsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get('/pending-goals', {
    preHandler: [app.authenticate], // Protege a rota
  }, async (request) => {
    const userId = request.user.userId; // Obtém o userId

    const { pendingGoals } = await getWeekPendingGoals({ userId });

    return { pendingGoals };
  });
}
