import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { goalCompletions, goals } from '../db/schema';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Sao_Paulo");

interface CreateGoalCompletionRequest {
  goalId: string;
  createdAt?: string; // Campo opcional para a data de conclusão
}

export async function createGoalCompletion({
  goalId,
  createdAt, // Recebendo opcionalmente a data
}: CreateGoalCompletionRequest) {
  const firstDayOfWeek = dayjs().startOf('week').tz('America/Sao_Paulo').toDate();
  const lastDayOfWeek = dayjs().endOf('week').tz('America/Sao_Paulo').toDate();

  // Verifica se o `createdAt` foi passado na requisição; se sim, utiliza, senão usa a data atual
  const nowTz = createdAt
    ? dayjs(createdAt).tz('America/Sao_Paulo').utc().toDate() // Converte o `createdAt` recebido para UTC
    : dayjs().tz('America/Sao_Paulo').utc().toDate(); // Se não foi passado, usa a data atual

  console.log("Now (UTC):", nowTz); // Essa será a data que será salva no banco, convertida para UTC

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
    throw new Error('Goal not found!');
  }

  const { completionCount, desiredWeeklyFrequency } = result[0];

  // Garantir que completionCount e desiredWeeklyFrequency estejam definidos e sejam valores numéricos
  if (typeof completionCount !== 'number' || typeof desiredWeeklyFrequency !== 'number') {
    throw new Error('Invalid data for goal completion or frequency!');
  }

  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error('Goal already completed the maximum number of times this week!');
  }

  // Agora salvando diretamente a data no formato UTC
  const insertResult = await db
    .insert(goalCompletions)
    .values({
      goalId,
      createdAt: nowTz,  // Salvando como `Date` no fuso horário UTC (mesmo horário, diferente timezone)
    })
    .returning();

  const goalCompletion = insertResult[0];
  console.log("Inserted Goal Completion:", goalCompletion);

  return {
    goalCompletion,
  };
}
