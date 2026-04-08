import type { AuthUser } from '@/contexts/AuthContext';

export function streamAndUiDisplayName(user: Pick<AuthUser, 'name' | 'email'>): string | undefined {
  const n = user.name?.trim();
  if (n) {
    return n;
  }
  const e = user.email?.trim();
  return e || undefined;
}
