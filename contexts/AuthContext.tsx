import { refreshAppThemeAfterLogin } from '@/services/appThemeBridge';
import type { UpdateUserProfilePayload } from '@/services/authApi';
import * as authApi from '@/services/authApi';
import { clearAuthSession, getAuthSession, saveAuthSession } from '@/services/authSessionStore';
import { disconnectGoogleAccount } from '@/services/googleAuth';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
  photoUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSession: (session: { token: string; user: Partial<AuthUser> }) => Promise<void>;
  register: (name: string, email: string, password: string, cpf: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateUserProfilePayload) => Promise<void>;
  uploadProfilePhoto: (uri: string, options?: { mimeType?: string; fileName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToRole(profile: string): UserRole {
  if (profile === 'CIDADAO') return 'client';
  return 'client';
}

function withPhotoCacheBust(url: string): string {
  const key = `v=${Date.now()}`;
  return url.includes('?') ? `${url}&${key}` : `${url}?${key}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      try {
        const session = await getAuthSession();
        if (!mounted || !session) return;
        authApi.setAuthToken(session.token);
        setUser(session.user);
      } catch {
        // Se não conseguir ler sessão antiga, app segue como deslogado.
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const data = await authApi.login(email, password);
    authApi.setAuthToken(data.token);
    const emailNorm = email.trim().toLowerCase();
    let nextUser: AuthUser = {
      id: data.userId,
      email: emailNorm,
      name: data.name?.trim() || '',
      role: profileToRole(data.profile),
      profile: data.profile,
      themeSlug: data.themeSlug ?? null,
      photoUrl: data.photoUrl ?? null,
    };
    setUser(nextUser);
    try {
      const details = await authApi.getUserById(data.userId);
      nextUser = {
        id: data.userId,
        email: details.email,
        name: (details.name ?? '').trim(),
        role: profileToRole(data.profile),
        profile: data.profile,
        themeSlug: data.themeSlug ?? null,
        uf: details.uf ?? undefined,
        govbrSub: details.govbrSub ?? undefined,
        cpf: details.cpf ?? null,
        photoUrl: details.photoUrl ?? null,
      };
      setUser(nextUser);
    } catch {
      nextUser = {
        id: data.userId,
        email: email.trim().toLowerCase(),
        name: '',
        role: profileToRole(data.profile),
        profile: data.profile,
        themeSlug: data.themeSlug ?? null,
        cpf: undefined,
        photoUrl: data.photoUrl ?? null,
      };
      setUser(nextUser);
    }
    try {
      await saveAuthSession({ token: data.token, user: nextUser });
    } catch {
    }
    try {
      await refreshAppThemeAfterLogin();
    } catch {
    }
  }, []);

  const loginWithSession = useCallback(
    async (session: { token: string; user: Partial<AuthUser> }): Promise<void> => {
      authApi.setAuthToken(session.token);
      const baseUser: AuthUser = {
        id: String(session.user.id ?? ''),
        email: String(session.user.email ?? '').trim().toLowerCase(),
        name: String(session.user.name ?? '').trim(),
        role: profileToRole(String(session.user.profile ?? 'CIDADAO')),
        profile: String(session.user.profile ?? 'CIDADAO'),
        themeSlug: session.user.themeSlug ?? null,
        uf: session.user.uf ?? undefined,
        govbrSub: session.user.govbrSub ?? undefined,
        cpf: session.user.cpf ?? undefined,
        photoUrl: session.user.photoUrl ?? null,
      };
      setUser(baseUser);
      try {
        await saveAuthSession({ token: session.token, user: baseUser });
      } catch {
      }
      try {
        await refreshAppThemeAfterLogin();
      } catch {
      }
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, cpf: string): Promise<void> => {
      await authApi.registerCitizen(name, email, password, cpf);
    },
    [],
  );

  const logout = useCallback(async () => {
    authApi.setAuthToken(null);
    setUser(null);
    try {
      await clearAuthSession();
    } catch {
    }
    await disconnectGoogleAccount();
  }, []);

  const uploadProfilePhoto = useCallback(
    async (uri: string, options?: { mimeType?: string; fileName?: string }): Promise<void> => {
      if (!user?.id) {
        throw new Error('Não autenticado');
      }
      const result = await authApi.uploadMyProfilePhotoFromUri(uri, options);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              photoUrl: withPhotoCacheBust(result.photoUrl),
            }
          : prev,
      );
    },
    [user?.id],
  );

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
            photoUrl: updated.photoUrl !== undefined ? updated.photoUrl : prev.photoUrl,
          }
        : null,
    );
  }, [user]);

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    loginWithSession,
    register,
    logout,
    updateProfile,
    uploadProfilePhoto,
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
