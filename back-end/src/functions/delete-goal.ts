import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { goals, goalCompletions } from '../db/schema'

interface DeleteGoalRequest {
  goalId: string
  userId: string
}

export async function deleteGoal({ goalId, userId }: DeleteGoalRequest) {
  try {
        // Verificar se a meta pertence ao usuário
      const [goal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, userId)
        )
      )
      .limit(1)

    if (!goal) {
      throw new Error('Meta não encontrada ou não pertence ao usuário.')
    }

    // Deletar todas as entradas relacionadas em goal_completions
    await db
      .delete(goalCompletions)
      .where(eq(goalCompletions.goalId, goalId))
      .execute()

    // Agora deletar a meta da tabela goals
    const deleteResult = await db
      .delete(goals)
      .where(eq(goals.id, goalId))
      .execute()

    const deletedGoalId = deleteResult[0]

    return {
      message: 'Goal and related completions deleted successfully',
      deletedGoalId: deletedGoalId,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete goal and completions: ${error.message}`);
    }
    throw new Error('Failed to delete goal and completions: Unknown error occurred');
  }
}