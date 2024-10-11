type SummaryResponse = {
  completed: number
  total: number
  goalsPerDay: Record<
    string,
    {
      id: string
      title: string
      completedAt: string
    }[]
  >
}

export async function getSummary(): Promise<SummaryResponse> {
  //const apiUrl = import.meta.env.VITE_API_URL
  const apiUrl = 'https://rocket-nlw-pocket.onrender.com/'
  const response = await fetch(`${apiUrl}summary`)
  const data = await response.json()

  return data.summary
}