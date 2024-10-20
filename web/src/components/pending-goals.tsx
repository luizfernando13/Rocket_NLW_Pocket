import { useContext } from 'react';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { OutlineButton } from './ui/outline-button';
import { getPendingGoals } from '../http/get-pending-goals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoalCompletion } from '../http/create-goal-completion';
import { getSummary } from '../http/get-summary';
import deleteGoal from '../http/delete-goal';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs'; // Importa o dayjs configurado
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function PendingGoals() {
  const queryClient = useQueryClient();
  const { logout } = useContext(AuthContext);

  const { data: goals } = useQuery({
    queryKey: ['pending-goals'],
    queryFn: getPendingGoals,
    staleTime: 1000 * 60,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    staleTime: 1000 * 60,
  });

  if (!goals) return null;

  const today = dayjs().tz('America/Sao_Paulo').format('YYYY-MM-DD');

  const goalsPerDayAdjusted: {
    [key: string]: {
      id: string;
      title: string;
      completedAt: string;
    }[];
  } = {};

  if (summaryData?.goalsPerDay) {
    for (const [, goals] of Object.entries(summaryData.goalsPerDay)) {
      for (const goal of goals) {
        const adjustedCompletedAt = dayjs
          .utc(goal.completedAt)
          .tz('America/Sao_Paulo');
        const adjustedDate = adjustedCompletedAt.format('YYYY-MM-DD');

        if (!goalsPerDayAdjusted[adjustedDate]) {
          goalsPerDayAdjusted[adjustedDate] = [];
        }

        goalsPerDayAdjusted[adjustedDate].push({
          ...goal,
          completedAt: adjustedCompletedAt.format('YYYY-MM-DDTHH:mm'),
        });
      }
    }
  }

  // Checa se o goal title já foi concluído hoje
  const titlesCompletedToday = new Set<string>();
  if (goalsPerDayAdjusted[today]) {
    for (const goal of goalsPerDayAdjusted[today]) {
      titlesCompletedToday.add(goal.title);
    }
  }

  async function handleCompletionGoal(goalId: string) {
    await createGoalCompletion(goalId);
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['pending-goals'] });
  }

  async function handleDeleteGoal(goalId: string) {
    await deleteGoal(goalId);
    queryClient.invalidateQueries({ queryKey: ['pending-goals'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
  }

  return (
    <div>
      {/* Botão de Logout */}
      <div className="absolute top-2 right-2 justify-end mb-4">
        <button
          type="button"
          onClick={logout}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          <LogOut className="mr-2" />
          Logout
        </button>
      </div>

      {/* Lista de Metas Pendentes */}
      <div className="flex flex-wrap gap-3">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2">
            <OutlineButton
              className="hover:bg-zinc-900"
              disabled={
                goal.completionCount >= goal.desiredWeeklyFrequency ||
                titlesCompletedToday.has(goal.title)
              }
              onClick={() => handleCompletionGoal(goal.id)}
            >
              <Plus className="size-4 text-zinc-600" />
              {goal.title}
            </OutlineButton>
            <button
              type="button"
              onClick={() => handleDeleteGoal(goal.id)}
              className="text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
