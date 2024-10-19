export async function createGoalCompletion(goalId: string, createdAt?: string) {
  const apiUrl = import.meta.env.VITE_API_URL
  const token = localStorage.getItem('token');

  await fetch(`${apiUrl}/goal-completions`, {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      goalId,
      createdAt, // Envia o campo `createdAt` se ele estiver presente
    })
  })
}
