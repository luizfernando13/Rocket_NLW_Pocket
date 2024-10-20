import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { goalCompletions, goals } from '../db/schema';
import dayjs from '../dayjsConfig'; // Importa o dayjs configurado
import { Mutex } from 'async-mutex'; // Importa o mutex para controle de concorrência

interface CreateGoalCompletionRequest {
  goalId: string;
  userId: string;
  createdAt?: string;
}

// Crie um mutex para controlar o acesso à operação de completar a meta
const completionMutex = new Mutex();

export async function createGoalCompletion({
  goalId,
  userId,
  createdAt,
}: CreateGoalCompletionRequest) {
  // Usa o mutex para bloquear o acesso até a operação ser finalizada
  return completionMutex.runExclusive(async () => {
    try {
      // Verifica se a meta pertence ao usuário
      const [goal] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .limit(1);

      if (!goal) {
        throw new Error('Meta não encontrada ou não pertence ao usuário.');
      }

      const now = dayjs().tz('America/Sao_Paulo');
      const startOfDay = now.startOf('day').utc().toDate(); // 
      const endOfDay = now.endOf('day').utc().toDate();

      const nowTz = createdAt
        ? dayjs(createdAt).tz('America/Sao_Paulo').toDate()
        : now.toDate();

      console.log('Now (Local Time):', nowTz);

      const completionToday = await db
        .select()
        .from(goalCompletions)
        .where(
          and(
            eq(goalCompletions.goalId, goalId),
            eq(goalCompletions.userId, userId),
            gte(goalCompletions.createdAt, startOfDay), // A meta foi completada após o início do dia de hoje
            lte(goalCompletions.createdAt, endOfDay) // A meta foi completada antes do final do dia de hoje
          )
        )
        .limit(1);

      if (completionToday.length > 0) {
        throw new Error('Você já completou essa meta hoje.');
      }

      // Verifica a frequência semanal
      const today = dayjs().tz('America/Sao_Paulo');
      const startOfWeek = today.startOf('isoWeek');
      const endOfWeek = today.endOf('isoWeek');

      const firstDayOfWeek = startOfWeek.toDate();
      const lastDayOfWeek = endOfWeek.toDate();

      const goalCompletionCounts = db.$with('goal_completion_counts').as(
        db
          .select({
            goalId: goalCompletions.goalId,
            completionCount: count(goalCompletions.id).as('completionCount'),
          })
          .from(goalCompletions)
          .where(
            and(
              gte(goalCompletions.createdAt, firstDayOfWeek),
              lte(goalCompletions.createdAt, lastDayOfWeek),
              eq(goalCompletions.goalId, goalId)
            )
          )
          .groupBy(goalCompletions.goalId)
      );

      const result = await db
        .with(goalCompletionCounts)
        .select({
          desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
          completionCount: sql`
          COALESCE(${goalCompletionCounts.completionCount}, 0)
          `.mapWith(Number),
        })
        .from(goals)
        .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
        .where(eq(goals.id, goalId))
        .limit(1);

      if (!result.length) {
        throw new Error('Meta não encontrada!');
      }

      const { completionCount, desiredWeeklyFrequency } = result[0];

      if (completionCount >= desiredWeeklyFrequency) {
        throw new Error('Você já completou essa meta o número máximo de vezes nesta semana!');
      }

      // Tenta inserir a nova conclusão de meta
      const insertResult = await db
        .insert(goalCompletions)
        .values({
          goalId,
          userId,
          createdAt: nowTz,
        })
        .returning();

      const goalCompletion = insertResult[0];
      console.log("Inserted Goal Completion:", goalCompletion);

      return {
        goalCompletion,
      };

    } catch (error) {
      if (error instanceof Error) {
        console.error("Erro ao completar meta:", error.message);
        throw new Error(`Erro ao completar meta: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao completar a meta.');
    }
  });
}
