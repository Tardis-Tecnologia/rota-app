import type { FeedNovidade } from '@/types/feedNovidade';

export function formatPublisherHandleLine(handle: string, dataRelativa: string): string {
  const h = handle.startsWith('@') ? handle : `@${handle}`;
  const time = dataRelativa.replace(/^há\s+/i, '').trim() || dataRelativa;
  return `${h} · ${time}`;
}

export function isSuperadminPublisherProfile(
  perfil: string | null | undefined,
  handle?: string | null,
): boolean {
  const p = perfil?.trim().toUpperCase();
  if (p === 'SUPERADMIN' || p === 'SUPER_ADMIN') return true;
  const h = (handle ?? '').toLowerCase();
  return h.includes('superadmin');
}

export function feedPublisherDisplayName(
  item: Pick<FeedNovidade, 'autorNome' | 'autorPerfil' | 'autorHandle'>,
): string {
  const name = item.autorNome?.trim();
  if (name && name !== 'Prefeito') return name;
  if (isSuperadminPublisherProfile(item.autorPerfil, item.autorHandle)) return 'Superadmin';
  return name || 'Administrador';
}
