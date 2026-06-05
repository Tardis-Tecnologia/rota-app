import { refreshAppThemeAfterLogin } from '@/services/appThemeBridge';
import type { UpdateUserProfilePayload, UserSummary } from '@/services/authApi';
import * as authApi from '@/services/authApi';
import { loginWithEmailPassword } from '@/services/loginApi';
import { clearAuthSession, getAuthSession, saveAuthSession } from '@/services/authSessionStore';
import { disconnectGoogleAccount } from '@/services/googleAuth';
import { disconnectStreamChat } from '@/services/streamChatApi';
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
  commercialCep?: string | null;
  commercialCnpj?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithSession: (session: { token: string; user: Partial<AuthUser> }) => Promise<void>;
  register: (name: string, email: string, password: string, cpf: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateUserProfilePayload) => Promise<void>;
  uploadProfilePhoto: (uri: string, options?: { mimeType?: string; fileName?: string }) => Promise<void>;
  refreshUserFromApi: () => Promise<void>;
  syncCommercialProfileSession: (profile: {
    storeName?: string;
    photoUrl?: string | null;
    cep?: string | null;
    cnpj?: string | null;
  }) => Promise<void>;
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

function bustPhotoIfPresent(url: string | null | undefined): string | null {
  const t = url?.trim();
  return t ? withPhotoCacheBust(t) : null;
}

function applyUserDetailsFromApi(prev: AuthUser, details: UserSummary): AuthUser {
  const next: AuthUser = {
    ...prev,
    email: details.email,
    name: (details.name ?? '').trim(),
    uf: details.uf ?? undefined,
    govbrSub: details.govbrSub ?? undefined,
    cpf: details.cpf ?? null,
  };
  if (Object.prototype.hasOwnProperty.call(details, 'photoUrl')) {
    next.photoUrl = bustPhotoIfPresent(details.photoUrl);
  }
  return next;
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
        const uid = session.user.id?.trim();
        const token = session.token;
        const profile = session.user.profile?.trim().toUpperCase() ?? '';
        const isCommercialProfile =
          profile === 'LOJA' ||
          profile.includes('LOJA') ||
          profile.includes('COMERCIO');
        if (uid && token && !isCommercialProfile) {
          try {
            const details = await authApi.getUserById(uid);
            if (!mounted) return;
            setUser((prev) => {
              if (!prev || prev.id !== uid) return prev;
              const next = applyUserDetailsFromApi(prev, details);
              void saveAuthSession({ token, user: next });
              return next;
            });
          } catch {
            /* mantém dados da sessão local */
          }
        }
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

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    try {
      await disconnectStreamChat();
    } catch {
      // ignore
    }
    const data = await loginWithEmailPassword(email, password);
    authApi.setAuthToken(data.token);
    const emailNorm = email.trim();
    let nextUser: AuthUser = {
      id: data.userId,
      email: emailNorm,
      name: data.name?.trim() || '',
      role: profileToRole(data.profile),
      profile: data.profile,
      themeSlug: data.themeSlug ?? null,
      photoUrl: bustPhotoIfPresent(data.photoUrl),
      ...(data.accountKind === 'commercial'
        ? {
            commercialCep: data.commercialCep ?? null,
            commercialCnpj: data.commercialCnpj ?? null,
          }
        : {}),
    };
    setUser(nextUser);

    if (data.accountKind === 'commercial') {
      try {
        await saveAuthSession({ token: data.token, user: nextUser });
      } catch {
        /* ignore */
      }
      try {
        await refreshAppThemeAfterLogin();
      } catch {
        /* ignore */
      }
      return nextUser;
    }

    try {
      const details = await authApi.getUserById(data.userId);
      nextUser = applyUserDetailsFromApi(nextUser, details);
      setUser(nextUser);
    } catch {
      nextUser = {
        id: data.userId,
        email: emailNorm,
        name: '',
        role: profileToRole(data.profile),
        profile: data.profile,
        themeSlug: data.themeSlug ?? null,
        cpf: undefined,
        photoUrl: bustPhotoIfPresent(data.photoUrl),
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
    return nextUser;
  }, []);

  const loginWithSession = useCallback(
    async (session: { token: string; user: Partial<AuthUser> }): Promise<void> => {
      try {
        await disconnectStreamChat();
      } catch {
        // ignore
      }
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
        photoUrl: bustPhotoIfPresent(session.user.photoUrl),
      };
      setUser(baseUser);
      try {
        await saveAuthSession({ token: session.token, user: baseUser });
      } catch {
      }
      const uid = baseUser.id.trim();
      const tok = session.token;
      if (uid) {
        void authApi
          .getUserById(uid)
          .then((details) => {
            setUser((prev) => {
              if (!prev || prev.id !== uid) return prev;
              const next = applyUserDetailsFromApi(prev, details);
              void saveAuthSession({ token: tok, user: next });
              return next;
            });
          })
          .catch(() => {
            /* mantém baseUser */
          });
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
      await disconnectStreamChat();
    } catch {
      // ignore
    }
    try {
      await clearAuthSession();
    } catch {
    }
    try {
      await disconnectGoogleAccount();
    } catch {
      // ignore
    }
  }, []);

  const uploadProfilePhoto = useCallback(
    async (uri: string, options?: { mimeType?: string; fileName?: string }): Promise<void> => {
      if (!user?.id) {
        throw new Error('Não autenticado');
      }
      const token = authApi.getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }
      const result = await authApi.uploadMyProfilePhotoFromUri(uri, options);
      setUser((prev) => {
        if (!prev) {
          return prev;
        }
        const next = {
          ...prev,
          photoUrl: withPhotoCacheBust(result.photoUrl),
        };
        void saveAuthSession({ token, user: next });
        return next;
      });
    },
    [user?.id],
  );

  const updateProfile = useCallback(async (payload: UpdateUserProfilePayload): Promise<void> => {
    if (!user?.id) {
      throw new Error('Não autenticado');
    }
    const token = authApi.getAuthToken();
    if (!token) {
      throw new Error('Não autenticado');
    }
    const updated = await authApi.updateUserProfile(user.id, payload);
    setUser((prev) => {
      if (!prev) {
        return null;
      }
      const next = {
        ...prev,
        name: updated.name,
        email: updated.email,
        uf: updated.uf ?? undefined,
        govbrSub: updated.govbrSub ?? undefined,
        cpf: updated.cpf ?? null,
        ...(Object.prototype.hasOwnProperty.call(updated, 'photoUrl')
          ? { photoUrl: bustPhotoIfPresent(updated.photoUrl) }
          : {}),
      };
      void saveAuthSession({ token, user: next });
      return next;
    });
  }, [user]);

  const refreshUserFromApi = useCallback(async () => {
    const token = authApi.getAuthToken();
    if (!token) return;
    const uid = user?.id?.trim();
    if (!uid) return;
    try {
      const details = await authApi.getUserById(uid);
      setUser((prev) => {
        if (!prev || prev.id !== uid) return prev;
        const next = applyUserDetailsFromApi(prev, details);
        void saveAuthSession({ token, user: next });
        return next;
      });
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  const syncCommercialProfileSession = useCallback(
    async (profile: {
      storeName?: string;
      photoUrl?: string | null;
      cep?: string | null;
      cnpj?: string | null;
    }) => {
      const token = authApi.getAuthToken();
      if (!token) return;
      setUser((prev) => {
        if (!prev) return prev;
        const next: AuthUser = {
          ...prev,
          ...(profile.storeName !== undefined ? { name: profile.storeName.trim() } : {}),
          ...(Object.prototype.hasOwnProperty.call(profile, 'photoUrl')
            ? { photoUrl: bustPhotoIfPresent(profile.photoUrl) }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(profile, 'cep')
            ? { commercialCep: profile.cep?.trim() || null }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(profile, 'cnpj')
            ? { commercialCnpj: profile.cnpj?.trim() || null }
            : {}),
        };
        void saveAuthSession({ token, user: next });
        return next;
      });
    },
    [],
  );

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    loginWithSession,
    register,
    logout,
    updateProfile,
    uploadProfilePhoto,
    refreshUserFromApi,
    syncCommercialProfileSession,
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
