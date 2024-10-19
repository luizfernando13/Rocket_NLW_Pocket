import { apiFetch } from "./api"

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
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const response = await apiFetch(`${apiUrl}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  return data.summary;
}