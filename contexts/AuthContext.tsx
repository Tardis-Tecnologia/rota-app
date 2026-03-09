import React, { createContext, useCallback, useContext, useState } from 'react';

export type UserRole = 'client';

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
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);


let MOCK_CREDENTIALS: Array<{
  email: string;
  password: string;
  name: string;
  role: UserRole;
}> = [
  { email: 'cliente@rota.com', password: 'cliente123', name: 'Cliente', role: 'client' },
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
        id: 'client-1',
        email: found.email,
        name: found.name,
        role: 'client',
      });
      return true;
    }
    return false;
  }, []);

  const register = useCallback((name: string, email: string, password: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    const exists = MOCK_CREDENTIALS.some((c) => c.email === trimmedEmail);
    if (exists) return false;
    MOCK_CREDENTIALS = [
      ...MOCK_CREDENTIALS,
      { email: trimmedEmail, password, name: name.trim(), role: 'client' },
    ];
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
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
