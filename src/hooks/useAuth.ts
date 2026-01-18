import { useState, useEffect } from 'react';
import { authService } from '@/services';
import { User, LoginRequest } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error inicializando usuario:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    setLoading(true);
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  const isAuthenticated = (): boolean => {
    return !!user && authService.isAuthenticated();
  };

  const hasRole = (role: string): boolean => {
    return user?.rol === role;
  };

  const isAdmin = (): boolean => {
    return hasRole('administrador');
  };

  const isProfesor = (): boolean => {
    return hasRole('profesor');
  };

  const isRepresentante = (): boolean => {
    return hasRole('representante');
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    isProfesor,
    isRepresentante,
  };
};
