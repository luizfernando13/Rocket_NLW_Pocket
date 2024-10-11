export default async function undoGoalCompletion(goalId: string) {
  const apiUrl = import.meta.env.VITE_API_URL
  await fetch(`${apiUrl}/goal-completion-undo`, {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
    },
    body: JSON.stringify({
      goalId,
    })
  })
}