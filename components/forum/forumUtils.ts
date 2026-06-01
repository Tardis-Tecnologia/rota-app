import { getApiBaseUrl } from '@/services/authApi';
import type {
  ForumAuthorDto,
  ForumPostListItemDto,
  ForumPostResponseDto,
} from '@/services/forumApi';
import {
  FORUM_PARTNER_STORE_POST_TYPE,
  type ForumAuthorCommercial,
} from '@/types/forumCommercial';

export { FORUM_PARTNER_STORE_POST_TYPE };

/** Posts do módulo Animais Perdidos — não entram no feed geral do fórum. */
export const FORUM_LOST_ANIMAL_POST_TYPE = 'lost_animal';

export function isPartnerStoreForumPost(post: {
  postType?: string | null;
  authorCommercial?: ForumAuthorCommercial | null;
}): boolean {
  if ((post.postType?.trim() ?? '') === FORUM_PARTNER_STORE_POST_TYPE) return true;
  return !!post.authorCommercial?.id?.trim();
}

/** Autor da publicação (cidadão ou loja comercial). */
export function isForumPostOwnedByUser(
  post: {
    userId?: string | null;
    authorCommercial?: ForumAuthorCommercial | null;
    postType?: string | null;
  },
  userId: string | undefined | null,
): boolean {
  const uid = userId?.trim();
  if (!uid) return false;
  if (isPartnerStoreForumPost(post)) {
    return post.authorCommercial?.id?.trim() === uid;
  }
  return post.userId?.trim() === uid;
}

export function buildStoreContactDraftMessage(storeName: string, postTitle?: string): string {
  const store = storeName.trim() || 'sua loja';
  const title = postTitle?.trim();
  if (title) {
    return `Olá! Vi a publicação "${title}" no fórum e gostaria de falar com ${store}.`;
  }
  return `Olá! Vi uma publicação de ${store} no fórum e gostaria de conversar.`;
}

export function forumListItemToFeedPost(row: ForumPostListItemDto): ForumPostResponseDto {
  return {
    ...row,
    content: '',
    updatedAt: row.createdAt,
    liked: row.liked ?? false,
  };
}

export function isExcludedFromGeneralForumFeed(post: {
  postType?: string | null;
  communityId?: string | null;
}): boolean {
  if (post.communityId?.trim()) return true;
  return (post.postType?.trim() ?? '') === FORUM_LOST_ANIMAL_POST_TYPE;
}

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

export function openForumAuthorProfile(
  author: ForumAuthorLike | null | undefined,
  router: { push: (args: { pathname: string; params: Record<string, string> }) => void },
): void {
  if (!author?.id?.trim()) return;
  router.push({
    pathname: '/forum/author',
    params: {
      userId: author.id,
      name: author.name ?? '',
      photoUrl: author.photoUrl ?? '',
    },
  });
}

export function openForumCommercialStoreProfile(
  post: Pick<
    ForumPostResponseDto,
    'id' | 'title' | 'locationDescription' | 'authorCommercial'
  >,
  router: { push: (args: { pathname: string; params: Record<string, string> }) => void },
): void {
  const commercial = post.authorCommercial;
  if (!commercial?.id?.trim()) return;
  const params: Record<string, string> = {
    commercialId: commercial.id,
    storeName: commercial.storeName ?? '',
    photoUrl: commercial.photoUrl ?? '',
    forumPostId: post.id,
    postTitle: post.title ?? '',
  };
  const locationDescription = post.locationDescription?.trim();
  if (locationDescription) params.locationDescription = locationDescription;
  if (commercial.description?.trim()) params.description = commercial.description.trim();
  if (commercial.address?.trim()) params.address = commercial.address.trim();
  if (commercial.cep?.trim()) params.cep = commercial.cep.trim();
  if (commercial.phone?.trim()) params.phone = commercial.phone.trim();
  if (commercial.latitude != null && Number.isFinite(commercial.latitude)) {
    params.latitude = String(commercial.latitude);
  }
  if (commercial.longitude != null && Number.isFinite(commercial.longitude)) {
    params.longitude = String(commercial.longitude);
  }
  router.push({ pathname: '/forum/store', params });
}

export function profileLabel(profile?: string | null): string | null {
  const p = profile?.trim().toUpperCase();
  if (!p) return null;
  if (p === 'CIDADAO') return 'Cidadão';
  if (p === 'VISITANTE') return 'Visitante';
  if (p === 'COMERCIANTE') return 'Comerciante';
  if (p === 'PRESTADOR') return 'Prestador';
  return p;
}
