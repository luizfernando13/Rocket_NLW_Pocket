import React, { createContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

interface JwtPayload {
  userId: string;
  exp: number;
}

export const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    console.log('Token ao carregar a página:', token);
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token expirado
          console.log('Token expirado');
          localStorage.removeItem('token');
          return false;
        }
        console.log('Token válido');
        return true;
      } catch (error) {
        // Token inválido
        console.log('Token inválido:', error);
        localStorage.removeItem('token');
        return false;
      }
    }
    console.log('Nenhum token encontrado');
    return false;
  });

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    console.log('Usuário autenticado');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    console.log('Usuário deslogado');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
