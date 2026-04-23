import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthUser } from '@/contexts/AuthContext';

const TOKEN_KEY = 'rota_auth_token';
const USER_KEY = 'rota_auth_user';

export interface StoredAuthSession {
  token: string;
  user: AuthUser;
}

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as { localStorage: Storage }).localStorage;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function saveAuthSession(session: StoredAuthSession): Promise<void> {
  const userRaw = JSON.stringify(session.user);
  const ls = webStorage();
  if (ls) {
    ls.setItem(TOKEN_KEY, session.token);
    ls.setItem(USER_KEY, userRaw);
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, session.token),
    SecureStore.setItemAsync(USER_KEY, userRaw),
  ]);
}

export async function clearAuthSession(): Promise<void> {
  const ls = webStorage();
  if (ls) {
    ls.removeItem(TOKEN_KEY);
    ls.removeItem(USER_KEY);
    return;
  }
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
}

export async function getAuthSession(): Promise<StoredAuthSession | null> {
  const ls = webStorage();
  const [token, userRaw] = ls
    ? [ls.getItem(TOKEN_KEY), ls.getItem(USER_KEY)]
    : await Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)]);

  if (!token || !userRaw) return null;

  try {
    const parsed = JSON.parse(userRaw) as Partial<AuthUser>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      token,
      user: {
        id: String(parsed.id ?? ''),
        email: String(parsed.email ?? ''),
        name: String(parsed.name ?? ''),
        role: parsed.role === 'client' ? 'client' : 'client',
        profile: String(parsed.profile ?? 'CIDADAO'),
        themeSlug: parsed.themeSlug ?? null,
        uf: parsed.uf ?? undefined,
        govbrSub: parsed.govbrSub ?? undefined,
        cpf: parsed.cpf ?? undefined,
        photoUrl: parsed.photoUrl ?? null,
      },
    };
  } catch {
    return null;
  }
}
