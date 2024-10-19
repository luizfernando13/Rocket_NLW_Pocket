import { useQuery } from '@tanstack/react-query';
import { Summary } from './summary';
import { CreateGoal } from './create-goal';
import { Dialog } from './ui/dialog';
import { EmptyGoals } from './empty-goals';
import { getSummary } from '../http/get-summary';

export default function Dashboard() {

  // Busca o resumo de metas (quantidade total, completadas, etc.)
  const { data, isLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    staleTime: 1000 * 60, // 60 segundos
  });

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  // Verifica se há metas criadas
  const hasGoals = data?.total && data.total > 0;

  return (
    <Dialog>
      {/* Se não houver metas criadas, renderiza EmptyGoals */}
      {!hasGoals ? (
        <EmptyGoals />
      ) : (
        <>
          {/* Se houver metas criadas ou completadas, renderiza Summary */}
          <Summary />
        </>
      )}

      {/* Sempre renderiza o componente para criar novas metas */}
      <CreateGoal />
    </Dialog>
  );
}
