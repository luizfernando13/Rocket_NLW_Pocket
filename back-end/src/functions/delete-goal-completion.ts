// back-end\src\functions\delete-goal-completion.ts

import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { goalCompletions, goals } from '../db/schema';

interface UndoGoalCompletionRequest {
  goalId: string;
  userId: string;
}

export async function undoGoalCompletion({
  goalId,
  userId,
}: UndoGoalCompletionRequest) {

  // Verificar se a conclusão pertence a uma meta do usuário
  const [completion] = await db
    .select({
      goalId: goalCompletions.goalId,
    })
    .from(goalCompletions)
    .where(eq(goalCompletions.id, goalId))
    .limit(1);

  if (!completion) {
    throw new Error('Conclusão não encontrada.');
  }

  // Verificar se a meta pertence ao usuário
  const [goal] = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.id, completion.goalId),
        eq(goals.userId, userId)
      )
    )
    .limit(1);

  if (!goal) {
    throw new Error('Meta não encontrada ou não pertence ao usuário.');
  }

  // Deletar a conclusão
  await db
    .delete(goalCompletions)
    .where(eq(goalCompletions.id, goalId))
    .execute();

  return {
    message: 'Goal completion undone successfully',
    deletedCompletionId: goalId,
  };
}
