import { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleRegister = async () => {
    setError(''); // Limpa o erro antes de iniciar o processo de registro

    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token);
        navigate('/');
      } else {
        try {
          // Faz o parsing da mensagem de erro, que é uma string JSON
          const parsedMessage = JSON.parse(data.message);
          const passwordError = parsedMessage.find(
            (error: { code: string; path: string[] }) =>
              error.code === 'too_small' && error.path.includes('password')
          );

          if (passwordError) {
            setError('Senha muito pequena, digite pelo menos 6 caracteres!');
          } else {
            setError(data.message || 'Erro ao registrar.');
          }
        } catch (parseError) {
          setError('Erro ao registrar.');
        }
        console.error('Erro ao registrar:', data);
      }
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError('Erro ao registrar.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-blue-600">
      <div className="bg-white rounded-lg shadow-lg p-10 max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <img
            alt="logo"
            src="https://openui.fly.dev/openui/24x24.svg?text=📝"
            className="w-20 h-20"
          />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Registrar</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          <div className="mb-6">
            <label className="block text-gray-600 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring focus:ring-green-500"
              placeholder="voce@exemplo.com"
              required
            />
          </div>
          <div className="mb-6 relative">
            <label className="block text-gray-600 mb-2" htmlFor="password">
              Senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring focus:ring-green-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-10 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className='translate-y-1' /> : <Eye className='translate-y-1' />}
            </button>
            {/* Exibe a mensagem de erro abaixo do campo de senha */}
            {error && (
              <p className="text-red-500 text-sm mt-2">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white w-full p-3 rounded-lg hover:bg-green-600 transition"
            disabled={!email || !password}
          >
            Registrar
          </button>
        </form>
        <p className="text-gray-600 text-center mt-6">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-blue-500 font-bold hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
