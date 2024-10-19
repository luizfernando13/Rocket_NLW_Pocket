export default async function deleteGoal(goalId: string) {
  const apiUrl = import.meta.env.VITE_API_URL
  const token = localStorage.getItem('token');

  await fetch(`${apiUrl}/delete-goal`, {
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
