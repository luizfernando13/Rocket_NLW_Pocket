export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    handleApiError();
  }

  return response;
}

// Função para tratar erro 401 e redirecionar
export const handleApiError = () => {
  localStorage.removeItem('token'); // Remove o token inválido
  window.location.href = '/login'; // Redireciona para a página de login
};
