import { listForumPosts, type ForumPostListItemDto } from '@/services/forumApi';

const DEFAULT_CONCURRENCY = 4;
const DEFAULT_POSTS_PER_CHANNEL = 15;

async function mapInChunks<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

export async function loadPostsForChannels(
  channelIds: string[],
  options?: { postsPerChannel?: number; concurrency?: number },
): Promise<ForumPostListItemDto[]> {
  if (channelIds.length === 0) return [];

  const postsPerChannel = options?.postsPerChannel ?? DEFAULT_POSTS_PER_CHANNEL;
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;

  const perChannel = await mapInChunks(channelIds, concurrency, (id) =>
    listForumPosts(undefined, { communityId: id, init: 0, end: postsPerChannel }),
  );

  const merged = perChannel.flat();
  const byId = new Map<string, ForumPostListItemDto>();
  for (const row of merged) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
