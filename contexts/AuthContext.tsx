import { refreshAppThemeAfterLogin } from '@/services/appThemeBridge';
import * as authApi from '@/services/authApi';
import React, { createContext, useCallback, useContext, useState } from 'react';

export type UserRole = 'client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile: string;
  themeSlug: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToRole(profile: string): UserRole {
  if (profile === 'CIDADAO') return 'client';
  return 'client';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const data = await authApi.login(email, password);
    authApi.setAuthToken(data.token);
    setUser({
      id: data.userId,
      email: email.trim().toLowerCase(),
      name: '', 
      role: profileToRole(data.profile),
      profile: data.profile,
      themeSlug: data.themeSlug ?? null,
    });
    try {
      await refreshAppThemeAfterLogin();
    } catch {
    }
  }, []);

  const register = useCallback((name: string, email: string, password: string): boolean => {
    return false;
  }, []);

  const logout = useCallback(() => {
    authApi.setAuthToken(null);
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
