import { getApiBaseUrl } from '@/services/authApi';
import type { ForumAuthorDto } from '@/services/forumApi';

export function formatTimeAgo(value: string): string {
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `Há ${diffD} d`;
}

export function forumPostImageUrl(mediaId: string | null): string | null {
  if (!mediaId) return null;
  return `${getApiBaseUrl()}/api/v1/upload/files/${encodeURIComponent(mediaId)}`;
}

export function withListImageCacheBust(url: string, epoch: number): string {
  return url.includes('?') ? `${url}&v=${epoch}` : `${url}?v=${epoch}`;
}

export function forumDisplayHandle(
  author: { id: string; name: string | null } | null | undefined,
): string {
  const id = author?.id ?? '';
  const raw = (author?.name || 'Morador').trim();
  const slug = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const suffix = id.replace(/-/g, '').slice(0, 6);
  return slug ? `@${slug}` : `@u_${suffix || '000000'}`;
}

export function formatOpinioesLabel(count: number): string {
  if (count === 1) return '1 opinião';
  return `${count} opiniões`;
}

export type ForumAuthorLike = ForumAuthorDto;
