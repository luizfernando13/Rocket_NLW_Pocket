import { eq } from 'drizzle-orm';
import { db } from '../db';
import { goals } from '../db/schema';

interface CreateGoalRequest {
  title: string;
  desiredWeeklyFrequency: number;
}

export async function createGoal({
  title,
  desiredWeeklyFrequency,
}: CreateGoalRequest) {
  // Verificar se já existe uma meta com o mesmo título
  const existingGoal = await db
    .select()
    .from(goals)
    .where(eq(goals.title, title))
    .limit(1)
    .execute();

  if (existingGoal.length > 0) {
    throw new Error('Já existe uma meta com esse título!');
  }

  // Se não existir, criar a nova meta
  const insertResult = await db
    .insert(goals)
    .values({
      title,
      desiredWeeklyFrequency,
    })
    .returning();

  return insertResult[0];
}