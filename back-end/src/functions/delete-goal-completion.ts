import { eq } from 'drizzle-orm';
import { db } from '../db';
import { goalCompletions } from '../db/schema';

interface UndoGoalCompletionRequest {
  goalId: string;
}

export async function undoGoalCompletion({
  goalId,
}: UndoGoalCompletionRequest) {

  // Deletar a última conclusão encontrada
  const deleteResult = await db
    .delete(goalCompletions)
    .where(eq(goalCompletions.id, goalId))
    .execute();

  const deletedCompletionId = deleteResult[0]
  

  return {
    message: 'Goal completion undone successfully',
    deletedCompletionId: deletedCompletionId,
  };
}