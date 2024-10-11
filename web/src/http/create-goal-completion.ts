export async function createGoalCompletion(goalId: string, createdAt?: string) {
  //const apiUrl = import.meta.env.VITE_API_URL
  const apiUrl = 'https://rocket-nlw-pocket.onrender.com/'
  await fetch(`${apiUrl}goal-completions`, {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
    },
    body: JSON.stringify({
      goalId,
      createdAt, // Envia o campo `createdAt` se ele estiver presente
    })
  })
}