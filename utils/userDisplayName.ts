import type { AuthUser } from '@/contexts/AuthContext';

/** Nomes que são tipo de perfil/papel, não pessoa — não devem aparecer no autor da postagem. */
const ROLE_LIKE_NAMES = new Set([
  'administrador',
  'admin',
  'administradora',
  'superadmin',
  'super admin',
  'superadministrador',
  'superadministradora',
  'visitante',
  'cidadao',
  'cidadão',
  'cidada',
  'cidadã',
  'comerciante',
  'prestador',
  'prefeito',
  'prefeitura',
]);

export function isRoleLikeDisplayName(name: string | null | undefined): boolean {
  const n = name?.trim().toLowerCase();
  if (!n) return true;
  if (ROLE_LIKE_NAMES.has(n)) return true;
  // Perfis em caixa alta vindos da API (ADMIN, CIDADAO…)
  const upper = name!.trim().toUpperCase();
  if (
    upper === 'ADMIN' ||
    upper === 'SUPERADMIN' ||
    upper === 'SUPER_ADMIN' ||
    upper === 'CIDADAO' ||
    upper === 'VISITANTE' ||
    upper === 'COMERCIANTE' ||
    upper === 'PRESTADOR'
  ) {
    return true;
  }
  return false;
}

/** Nome de pessoa para UI; ignora rótulos de perfil. */
export function personDisplayName(
  name: string | null | undefined,
  fallback = 'Morador(a)',
): string {
  const n = name?.trim();
  if (n && !isRoleLikeDisplayName(n)) return n;
  return fallback;
}

export function streamAndUiDisplayName(user: Pick<AuthUser, 'name' | 'email'>): string | undefined {
  const n = user.name?.trim();
  if (n && !isRoleLikeDisplayName(n)) {
    return n;
  }
  const e = user.email?.trim();
  if (e) {
    const local = e.split('@')[0]?.trim();
    if (local) {
      const pretty = local
        .replace(/[._-]+/g, ' ')
        .replace(/\d+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pretty && !isRoleLikeDisplayName(pretty)) {
        return pretty
          .split(' ')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ');
      }
    }
    return e;
  }
  return undefined;
}
