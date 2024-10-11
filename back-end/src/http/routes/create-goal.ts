import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { createGoal } from "../../functions/create-goal";

export const createGoalRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/goals', {
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().int().min(1).max(7),
      }),
    }
  }, async (request, reply) => {
    const { title, desiredWeeklyFrequency } = request.body;

    console.log('Requisição recebida no back-end:', title, desiredWeeklyFrequency);

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        // Tenta criar a meta no banco de dados
        await createGoal({ title, desiredWeeklyFrequency });

        // Se o processo for bem-sucedido, envia uma resposta de sucesso
        return reply.status(201).send({ message: 'Meta criada com sucesso!' });
      } catch (error) {
        attempt++;
        console.error(`Erro ao criar a meta na tentativa ${attempt}:`, error);

        if (attempt >= maxAttempts) {
          // Se todas as tentativas falharem, retorna uma resposta de erro
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          return reply.status(500).send({
            message: 'Erro ao criar a meta após múltiplas tentativas',
            error: errorMessage,
          });
        }

        // Espera 3 segundos antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  });
};
