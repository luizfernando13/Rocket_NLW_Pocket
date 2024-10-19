import { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleLogin = async () => {
    setError(''); // Limpa o erro antes de iniciar o processo de login

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token);
        navigate('/');
      } else {
        // Exibe a mensagem de erro recebida do back-end
        setError(data.message || 'Erro ao fazer login.');
        console.error('Erro ao fazer login:', data);
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Erro ao fazer login.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-pink-400 to-purple-600">
      <div className="bg-white rounded-lg shadow-lg p-10 max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <img
            alt="logo"
            src="https://openui.fly.dev/openui/24x24.svg?text=🔑"
            className="w-20 h-20"
          />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Entrar</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
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
              className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring focus:ring-pink-500"
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
              className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring focus:ring-pink-500"
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
            className="bg-pink-500 text-white w-full p-3 rounded-lg hover:bg-pink-600 transition"
            disabled={!email || !password}
          >
            Entrar
          </button>
        </form>
        <p className="text-gray-600 text-center mt-6">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-purple-500 font-bold hover:underline">
            Registrar aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
