import { refreshAppThemeAfterLogin } from '@/services/appThemeBridge';
import * as authApi from '@/services/authApi';
import type { UpdateUserProfilePayload } from '@/services/authApi';
import React, { createContext, useCallback, useContext, useState } from 'react';

export type UserRole = 'client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile: string;
  themeSlug: string | null;
  uf?: string | null;
  govbrSub?: string | null;
  cpf?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, cpf: string) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: UpdateUserProfilePayload) => Promise<void>;
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
    const emailNorm = email.trim().toLowerCase();
    const baseUser: AuthUser = {
      id: data.userId,
      email: emailNorm,
      name: data.name?.trim() || '',
      role: profileToRole(data.profile),
      profile: data.profile,
      themeSlug: data.themeSlug ?? null,
    };
    setUser(baseUser);
    try {
      const details = await authApi.getUserById(data.userId);
      setUser({
        id: data.userId,
        email: details.email,
        name: (details.name ?? '').trim(),
        role: profileToRole(data.profile),
        profile: data.profile,
        themeSlug: data.themeSlug ?? null,
        uf: details.uf ?? undefined,
        govbrSub: details.govbrSub ?? undefined,
        cpf: details.cpf ?? null,
      });
    } catch {
      setUser({
        id: data.userId,
        email: email.trim().toLowerCase(),
        name: '',
        role: profileToRole(data.profile),
        profile: data.profile,
        themeSlug: data.themeSlug ?? null,
        cpf: undefined,
      });
    }
    try {
      await refreshAppThemeAfterLogin();
    } catch {
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, cpf: string): Promise<void> => {
      await authApi.registerCitizen(name, email, password, cpf);
    },
    [],
  );

  const logout = useCallback(() => {
    authApi.setAuthToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload: UpdateUserProfilePayload): Promise<void> => {
    if (!user?.id) {
      throw new Error('Não autenticado');
    }
    const updated = await authApi.updateUserProfile(user.id, payload);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            name: updated.name,
            email: updated.email,
            uf: updated.uf ?? undefined,
            govbrSub: updated.govbrSub ?? undefined,
            cpf: updated.cpf ?? null,
          }
        : null,
    );
  }, [user]);

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
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
