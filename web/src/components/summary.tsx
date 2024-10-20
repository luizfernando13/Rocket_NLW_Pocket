import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { DialogTrigger } from './ui/dialog';
import { InOrbitIcon } from './in-orbit-icon';
import { Separator } from './ui/separator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSummary } from '../http/get-summary';
import dayjs from 'dayjs'; // Importa o dayjs configurado globalmente
import { PendingGoals } from './pending-goals';
import { WithCompletion } from './with-completion';
import { LoadingScreen } from './LoadingScreen'; // Importa o componente de loading

export function Summary() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    staleTime: 1000 * 60,
  });

  const today = dayjs().tz('America/Sao_Paulo').startOf('day');
  const startOfWeek = today.startOf('isoWeek');
  const endOfWeek = today.endOf('isoWeek');
  const firstDayOfWeek = startOfWeek.format('D MMM');
  const lastDayOfWeek = endOfWeek.format('D MMM');

  if (error) {
    return <p>Ocorreu um erro: {error.message}</p>;
  }

  return (
    <div className="relative">
      <LoadingScreen isLoading={isLoading} /> {/* Adiciona o componente de loading */}

      <div className={`py-10 max-w-[480px] px-5 mx-auto flex flex-col gap-6 ${isLoading ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InOrbitIcon />
            <span className="text-lg font-semibold capitalize">
              {firstDayOfWeek} - {lastDayOfWeek}
            </span>
          </div>

          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Cadastrar Meta
            </Button>
          </DialogTrigger>
        </div>

        <Separator />

        {/* Renderiza as metas pendentes ou, se existir, os dados completos */}
        {!data || data.goalsPerDay === null ? (
          <>
            <PendingGoals />
            <h2 className="font-serif text-[17px]">Você não completou nenhuma meta nesta semana ainda!</h2>
          </>
        ) : (
          <WithCompletion data={data} queryClient={queryClient} />
        )}
      </div>
    </div>
  );
}
