import { CheckCircle2 } from 'lucide-react';
import { Progress, ProgressIndicator } from './ui/progress-bar';
import { Separator } from './ui/separator';
import dayjs from 'dayjs';
import undoGoalCompletion from "../http/undo-goal-completion";
import { PendingGoals } from './pending-goals';
import type { QueryClient } from '@tanstack/react-query';
import ptBR from "dayjs/locale/pt-br.js";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';

// Activate the plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.locale(ptBR);

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

  // Define today's and yesterday's dates in 'America/Sao_Paulo' time zone
  const today = dayjs().tz('America/Sao_Paulo').startOf('day');
  const yesterday = today.subtract(1, 'day');

  // Adjust the goalsPerDay object to use local dates
  const goalsPerDayAdjusted: {
    [key: string]: {
      id: string;
      title: string;
      completedAt: string;
    }[];
  } = {};

  // Iterate over the original goalsPerDay
  //console.log("Dados originais das metas:", data.goalsPerDay);
  for (const [, goals] of Object.entries(data.goalsPerDay)) {
    for (const goal of goals) {
      // Converte a data e hora para o fuso de São Paulo
      const adjustedCompletedAt = dayjs.utc(goal.completedAt).tz('America/Sao_Paulo');
      const adjustedDate = adjustedCompletedAt.format('YYYY-MM-DD');
      //console.log("Data ajustada para fuso de Sao Paulo:", adjustedDate);
      //console.log("Data e hora ajustadas para meta:", goal.title, adjustedCompletedAt.format('YYYY-MM-DDTHH:mm'));

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

  // Filtra as datas que estão dentro do intervalo da semana atual
  const startOfWeek = today.startOf('week').add(1, 'day'); // Começa na segunda-feira
  const endOfWeek = startOfWeek.add(6, 'day').endOf('day'); // Ajusta para o final do dia no domingo
  const goalsThisWeek = Object.entries(goalsPerDayAdjusted).filter(([date]) => {
    const goalDate = dayjs(date);
    return goalDate.isBetween(startOfWeek, endOfWeek, null, '[]');
  });

  // Log goals that are being filtered for display
  console.log("Metas ajustadas para exibição nesta semana:", goalsThisWeek);

  // Log goals that are not being displayed
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
          // Parse the adjusted date string
          const goalDate = dayjs(date).startOf('day');

          let weekDay: string;

          // Check if the date is today, yesterday, or another day
          if (goalDate.isSame(today, 'day')) {
            weekDay = 'hoje';
          } else if (goalDate.isSame(yesterday, 'day')) {
            weekDay = 'ontem';
          } else {
            weekDay = goalDate.format('dddd'); // Use the day name for other days
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
                  // Parse completedAt time
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