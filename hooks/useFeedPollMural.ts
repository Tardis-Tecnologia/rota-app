import {
  getNews,
  newsItemToFeedItem,
  sortNovidadesByDate,
} from '@/services/newsApi';
import type { FeedNovidade } from '@/types/feedNovidade';
import { isFeedPollItem } from '@/types/feedNovidade';
import { useCallback, useRef, useState } from 'react';

const PAGE_SIZE = 15;

function onlyPolls(items: FeedNovidade[]): FeedNovidade[] {
  return items.filter(isFeedPollItem);
}

export function useFeedPollMural() {
  const [items, setItems] = useState<FeedNovidade[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rawOffsetRef = useRef(0);

  const fetchPage = useCallback(async (rawOffset: number) => {
    const list = await getNews({
      status: 'published',
      init: rawOffset,
      end: rawOffset + PAGE_SIZE,
    });
    const mapped = sortNovidadesByDate(list.map(newsItemToFeedItem));
    return { mapped, rawCount: list.length };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    rawOffsetRef.current = 0;
    try {
      const { mapped, rawCount } = await fetchPage(0);
      rawOffsetRef.current = rawCount;
      setItems(onlyPolls(mapped));
      setHasMore(rawCount === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as enquetes.');
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
      const { mapped, rawCount } = await fetchPage(offset);
      rawOffsetRef.current = offset + rawCount;
      setItems((prev) => sortNovidadesByDate([...prev, ...onlyPolls(mapped)]));
      setHasMore(rawCount === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar mais enquetes.');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  const updateItem = useCallback((id: string, patch: Partial<FeedNovidade>) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch, poll: patch.poll ?? row.poll } : row)),
    );
  }, []);

  return {
    items,
    hasMore,
    loading,
    loadingMore,
    refreshing,
    error,
    loadInitial,
    loadMore,
    refresh,
    updateItem,
  };
}
