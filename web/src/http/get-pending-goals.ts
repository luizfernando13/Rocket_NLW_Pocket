import { apiFetch } from "./api";

type PendingGoalsResponse = {
  id: string;
  title: string;
  desiredWeeklyFrequency: number;
  completionCount: number;
}[]

export async function getPendingGoals(): Promise<PendingGoalsResponse> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const response = await apiFetch(`${apiUrl}/pending-goals`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  return data.pendingGoals;
}
