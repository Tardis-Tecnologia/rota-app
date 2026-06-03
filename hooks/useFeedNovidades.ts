import {
  buildNewsFeedQuery,
  getNews,
  newsItemToFeedItem,
  sortNovidadesByDate,
} from '@/services/newsApi';
import { FeedFilter } from '@/types';
import type { FeedNovidade } from '@/types/feedNovidade';
import { isFeedPollItem } from '@/types/feedNovidade';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function applyClientFeedFilter(items: FeedNovidade[], filter: FeedFilter): FeedNovidade[] {
  if (filter === 'enquetes') return items.filter(isFeedPollItem);
  if (filter === 'todos') return items;
  return items.filter((item) => !isFeedPollItem(item));
}

function dedupeFeedItemsById(items: FeedNovidade[]): FeedNovidade[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function mergeFeedPages(prev: FeedNovidade[], page: FeedNovidade[]): FeedNovidade[] {
  return dedupeFeedItemsById(sortNovidadesByDate([...prev, ...page]));
}

const PAGE_SIZE = 10;

export function useFeedNovidades() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('todos');
  const [items, setItems] = useState<FeedNovidade[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const rawOffsetRef = useRef(0);

  const feedQuery = useMemo(() => buildNewsFeedQuery(activeFilter), [activeFilter]);

  const fetchPage = useCallback(
    async (offset: number) => {
      const list = await getNews({
        status: 'published',
        ...feedQuery,
        init: offset,
        end: offset + PAGE_SIZE,
      });
      const page = applyClientFeedFilter(
        sortNovidadesByDate(list.map(newsItemToFeedItem)),
        activeFilter,
      );
      return { items: page, rawCount: list.length };
    },
    [activeFilter, feedQuery],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      rawOffsetRef.current = 0;
      const { items: page, rawCount } = await fetchPage(0);
      setItems(dedupeFeedItemsById(page));
      rawOffsetRef.current = rawCount;
      setImageEpoch(Date.now());
      setHasMore(rawCount === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as novidades.');
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const offset = rawOffsetRef.current;
      const { items: page, rawCount } = await fetchPage(offset);
      rawOffsetRef.current = offset + rawCount;
      setItems((prev) => mergeFeedPages(prev, page));
      setHasMore(rawCount === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar mais novidades.');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const updateItem = useCallback((id: string, patch: Partial<FeedNovidade>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  return {
    activeFilter,
    setActiveFilter,
    items,
    setItems,
    updateItem,
    hasMore,
    loading,
    loadingMore,
    refreshing,
    error,
    imageEpoch,
    loadInitial,
    loadMore,
    refresh,
  };
}
