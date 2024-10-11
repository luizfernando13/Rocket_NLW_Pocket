import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { undoGoalCompletion } from "../../functions/delete-goal-completion";

export const undoCompletionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/goal-completion-undo', {
    schema: {
        body: z.object({
            goalId: z.string()
    }),
    }
}, async (request) => {
    const { goalId } = request.body

    await undoGoalCompletion({
        goalId,
    })
})
}