import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getWeekSummary } from "../../functions/get-week-summary";

export const getWeekSummaryRoute: FastifyPluginAsyncZod = async (app) => {
  app.get('/summary', {
    preHandler: [app.authenticate], // Protege a rota
  }, async (request) => {
    const userId = request.user.userId; // Obtém o userId
    console.log('Buscando metas para o userId:', userId);

    const { summary } = await getWeekSummary({ userId });

    return { summary };
  });
}
