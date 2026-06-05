import type { ForumPostResponseDto } from '@/services/forumApi';
import type {
  ForumCommunityDetail,
  ForumCommunityListItem,
} from '@/services/forumCommunityApi';

type CarouselCache = {
  channels: ForumCommunityListItem[];
  loadedAt: number;
};

type MineListCache = {
  items: ForumCommunityListItem[];
  loadedAt: number;
};

export type ExploreFeedCacheEntry = {
  posts: ForumPostResponseDto[];
  channelNamesById: Record<string, string>;
  followingCount: number;
  loadedAt: number;
};

type CommunityDetailCache = {
  community: ForumCommunityDetail;
  posts: ForumPostResponseDto[];
  loadedAt: number;
};

let carouselCache: CarouselCache | null = null;
let mineListCache: MineListCache | null = null;
const exploreFeedCache = new Map<string, ExploreFeedCacheEntry>();
const communityDetailCache = new Map<string, CommunityDetailCache>();

export function getExploreFeedCacheKey(communityId?: string): string {
  return communityId?.trim() || '__aggregate__';
}

export function getCachedCarouselChannels(): CarouselCache | null {
  return carouselCache;
}

export function setCachedCarouselChannels(channels: ForumCommunityListItem[]): void {
  carouselCache = { channels, loadedAt: Date.now() };
}

export function getCachedMineList(): MineListCache | null {
  return mineListCache;
}

export function setCachedMineList(items: ForumCommunityListItem[]): void {
  mineListCache = { items, loadedAt: Date.now() };
}

export function getCachedExploreFeed(key: string): ExploreFeedCacheEntry | null {
  return exploreFeedCache.get(key) ?? null;
}

export function setCachedExploreFeed(key: string, entry: Omit<ExploreFeedCacheEntry, 'loadedAt'>): void {
  exploreFeedCache.set(key, { ...entry, loadedAt: Date.now() });
}

export function invalidateExploreFeedCache(key?: string): void {
  if (key) {
    exploreFeedCache.delete(key);
    return;
  }
  exploreFeedCache.clear();
}

export function getCachedCommunityDetail(
  communityId: string,
): CommunityDetailCache | null {
  return communityDetailCache.get(communityId) ?? null;
}

export function setCachedCommunityDetail(
  communityId: string,
  community: ForumCommunityDetail,
  posts: ForumPostResponseDto[],
): void {
  communityDetailCache.set(communityId, {
    community,
    posts,
    loadedAt: Date.now(),
  });
}

export function invalidateCommunityDetailCache(communityId?: string): void {
  if (communityId) {
    communityDetailCache.delete(communityId);
    return;
  }
  communityDetailCache.clear();
}
