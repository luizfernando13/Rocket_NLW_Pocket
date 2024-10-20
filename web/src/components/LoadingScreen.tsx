import { useEffect, useState } from 'react';
import logo from '../assets/logo-in-orbit.svg';

interface LoadingScreenProps {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000); // Define o tempo fixo de 3 segundos

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading && !showLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center box-border bg-slate-900 z-50">
      <div className="text-center">
        <img src={logo} alt="Logo" className="w-48 h-48 mb-4 ml-7" />

        {/* Spinner de loading abaixo da logo */}
        <div className="flex justify-center items-center mb-11">
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin" />
        </div>

        <p className="text-2xl font-semibold text-white">Carregando informações...</p>
      </div>
    </div>
  );
}
