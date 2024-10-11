interface CreateGoalRequest {
  title: string;
  desiredWeeklyFrequency: number;
}

export async function createGoal({
  title,
  desiredWeeklyFrequency,
}: CreateGoalRequest) {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Função para tentar fazer a requisição
  const attemptRequest = async (retryCount = 0): Promise<unknown> => {
    try {
      const response = await fetch(`${apiUrl}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, desiredWeeklyFrequency }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar a meta');
      }

      return await response.json();
    } catch (error) {
      // Verifica o tipo de erro
      if (error instanceof Error && error.message.includes("CONNECTION_ENDED") && retryCount < 3) {
        console.log("Tentando reconectar ao banco de dados...");
        await new Promise(resolve => setTimeout(resolve, 3000)); // Aguarda 3 segundos
        return attemptRequest(retryCount + 1); // Tenta novamente
      }

      throw error; // Sem o 'else', já que o 'if' lança o erro
    }
  };

  return attemptRequest();
}