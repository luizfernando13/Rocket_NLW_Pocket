import fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { createGoalRoute } from "./routes/create-goal";
import { createCompletionRoute } from "./routes/create-completion";
import { getPendingGoalsRoute } from "./routes/get-pending-goals";
import { getWeekSummaryRoute } from "./routes/get-week-summary";
import fastifyCors from "@fastify/cors";
import { undoCompletionRoute } from "./routes/undo-completion";
import { deleteGoalRoute } from "./routes/delete-goal";
import { env } from '../env'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: '*',
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createGoalRoute)
app.register(createCompletionRoute)
app.register(getPendingGoalsRoute)
app.register(getWeekSummaryRoute)
app.register(undoCompletionRoute)
app.register(deleteGoalRoute)





app.listen({
    port: env.PORT,
    host: '0.0.0.0',
}).then(() => {
   console.log(`Server running on port ${env.PORT}!!! 🚀`)
})