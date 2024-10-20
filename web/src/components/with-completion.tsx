import { CheckCircle2 } from 'lucide-react';
import { Progress, ProgressIndicator } from './ui/progress-bar';
import { Separator } from './ui/separator';
import dayjs from 'dayjs';
import undoGoalCompletion from "../http/undo-goal-completion";
import { PendingGoals } from './pending-goals';
import type { QueryClient } from '@tanstack/react-query';

interface WithCompletionProps {
  data: {
    completed: number;
    total: number;
    goalsPerDay: {
      [key: string]: {
        id: string;
        title: string;
        completedAt: string;
      }[];
    };
  };
  queryClient: QueryClient;
}

export function WithCompletion({ data, queryClient }: WithCompletionProps) {
  async function handleUndoCompletionGoal(goalId: string) {
    await undoGoalCompletion(goalId);
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['pending-goals'] });
  }

  const completedPercentage = Math.round((data?.completed * 100) / data?.total);

  const today = dayjs().tz('America/Sao_Paulo').startOf('day');
  const yesterday = today.subtract(1, 'day');
  const startOfWeek = today.startOf('isoWeek');
  const endOfWeek = today.endOf('isoWeek');

  const goalsPerDayAdjusted: {
    [key: string]: {
      id: string;
      title: string;
      completedAt: string;
    }[];
  } = {};

  for (const [, goals] of Object.entries(data.goalsPerDay)) {
    for (const goal of goals) {

      const adjustedCompletedAt = dayjs.utc(goal.completedAt).tz('America/Sao_Paulo');
      const adjustedDate = adjustedCompletedAt.format('YYYY-MM-DD');

      // Inicializa o array se ele não existir
      if (!goalsPerDayAdjusted[adjustedDate]) {
        goalsPerDayAdjusted[adjustedDate] = [];
      }

      // Anexa as metas na data ajustada
      goalsPerDayAdjusted[adjustedDate].push({
        ...goal,
        completedAt: adjustedCompletedAt.format('YYYY-MM-DDTHH:mm')
      });
    }
  }

  const goalsThisWeek = Object.entries(goalsPerDayAdjusted).filter(([date]) => {
    const goalDate = dayjs(date);
    return goalDate.isBetween(startOfWeek, endOfWeek, null, '[]');
  });

  console.log("Metas ajustadas para exibição nesta semana:", goalsThisWeek);

  const goalsNotDisplayed = Object.entries(goalsPerDayAdjusted).filter(([date]) => {
    const goalDate = dayjs(date);
    return !goalDate.isBetween(startOfWeek, endOfWeek, null, '[]');
  });
  console.log("Metas que não estão sendo exibidas nesta semana:", goalsNotDisplayed);

  return (
    <>
      <div className="flex flex-col gap-3">
        <Progress value={8} max={15}>
          <ProgressIndicator style={{ width: `${completedPercentage}%` }} />
        </Progress>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>
          Você completou{' '}
          <span className="text-zinc-100">{data?.completed}</span> de{' '}
          <span className="text-zinc-100">{data?.total}</span> metas nessa semana.
        </span>
        <span>{completedPercentage}%</span>
      </div>

      <Separator />

      <PendingGoals />

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-medium">Sua semana</h2>

        {goalsThisWeek.map(([date, goals]) => {
          const goalDate = dayjs(date).startOf('day');

          let weekDay: string;

          if (goalDate.isSame(today, 'day')) {
            weekDay = 'hoje';
          } else if (goalDate.isSame(yesterday, 'day')) {
            weekDay = 'ontem';
          } else {
            weekDay = goalDate.format('dddd');
          }

          const formattedDate = goalDate.format('D [de] MMMM');

          return (
            <div key={date} className="flex flex-col gap-4">
              <h3 className="font-medium">
                <span className='capitalize'>{weekDay}</span>{' '}
                <span className="text-zinc-400 text-xs">({formattedDate})</span>
              </h3>

              <ul className="flex flex-col gap-3">
                {goals.map(goal => {
                  const time = dayjs(goal.completedAt).format('HH:mm');

                  return (
                    <li key={goal.id} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-pink-500" />
                      <span className="text-sm text-zinc-400">
                        Você completou "
                        <span className="text-zinc-100">{goal.title}</span>" às{' '}
                        <span className="text-zinc-100">{time}h </span>
                        <button
                          type='button'
                          className='text-zinc-500 underline'
                          onClick={() => handleUndoCompletionGoal(goal.id)}
                        >
                          Desfazer
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}