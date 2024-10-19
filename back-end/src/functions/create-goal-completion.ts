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
  userId: string;
  createdAt?: string;
}

// Mutex para garantir que uma conclusão de meta seja processada por vez
const goalCompletionLocks: { [key: string]: Promise<void> | null } = {};

export async function createGoalCompletion({
  goalId,
  userId,
  createdAt,
}: CreateGoalCompletionRequest) {

  // Se houver uma operação em andamento para essa meta, espera até que seja concluída
  if (goalCompletionLocks[goalId]) {
    await goalCompletionLocks[goalId];
  }

  // Inicializando o resolveLock como undefined e atribuindo o valor dentro da Promise
  let resolveLock: (() => void) | undefined;
  goalCompletionLocks[goalId] = new Promise((resolve) => {
    resolveLock = resolve;
  });

  try {
    // Verifica se a meta pertence ao usuário
    const [goal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, userId)
        )
      )
      .limit(1);

    if (!goal) {
      throw new Error('Meta não encontrada ou não pertence ao usuário.');
    }

    const firstDayOfWeek = dayjs().startOf('week').tz('America/Sao_Paulo').toDate();
    const lastDayOfWeek = dayjs().endOf('week').tz('America/Sao_Paulo').toDate();

    const nowTz = createdAt
      ? dayjs(createdAt).tz('America/Sao_Paulo').utc().toDate()
      : dayjs().tz('America/Sao_Paulo').utc().toDate();

    console.log("Now (UTC):", nowTz);

    const twoMinutesAgo = dayjs().tz('America/Sao_Paulo').subtract(2, 'minute').utc().toDate();

    // Verifica se já existe uma conclusão da mesma meta nos últimos 2 minutos
    const recentCompletion = await db
      .select()
      .from(goalCompletions)
      .where(
        and(
          eq(goalCompletions.goalId, goalId),
          eq(goalCompletions.userId, userId),
          gte(goalCompletions.createdAt, twoMinutesAgo)
        )
      )
      .limit(1);

    if (recentCompletion.length > 0) {
      throw new Error('Você já completou esta meta nos últimos 2 minutos. Aguarde para tentar novamente.');
    }

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

    if (completionCount >= desiredWeeklyFrequency) {
      throw new Error('Você já completou essa meta o número máximo de vezes nesta semana!');
    }

    // Agora salvando diretamente a data no formato UTC
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

  } finally {
    // Libera a trava ao final do processamento, se a trava existir
    if (resolveLock) {
      resolveLock();
    }
    goalCompletionLocks[goalId] = null;
  }
}
