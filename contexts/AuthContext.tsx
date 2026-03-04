import React, { createContext, useCallback, useContext, useState } from 'react';

export type UserRole = 'admin' | 'client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_CREDENTIALS = [
  { email: 'admin@rota.com', password: 'admin123', name: 'Administrador', role: 'admin' as UserRole },
  { email: 'cliente@rota.com', password: 'cliente123', name: 'Cliente', role: 'client' as UserRole },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading] = useState(false);

  const login = useCallback((email: string, password: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    const found = MOCK_CREDENTIALS.find(
      (c) => c.email === trimmedEmail && c.password === password
    );
    if (found) {
      setUser({
        id: found.role === 'admin' ? 'admin-1' : 'client-1',
        email: found.email,
        name: found.name,
        role: found.role,
      });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
