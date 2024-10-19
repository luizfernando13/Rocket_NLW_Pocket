export default async function undoGoalCompletion(goalId: string) {
  const apiUrl = import.meta.env.VITE_API_URL
  const token = localStorage.getItem('token');

  await fetch(`${apiUrl}/goal-completion-undo`, {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
      'Authorization': `Bearer ${token}`, // Adicionado
    },
    body: JSON.stringify({
      goalId,
    })
  })
}
