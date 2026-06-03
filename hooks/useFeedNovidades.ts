import {
  getNews,
  NEWS_FEED_TAG,
  newsItemToNovidade,
  sortNovidadesByDate,
} from '@/services/newsApi';
import { FeedFilter } from '@/types';
import type { FeedNovidade } from '@/types/feedNovidade';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const itemsLengthRef = useRef(0);
  itemsLengthRef.current = items.length;

  const feedTag = useMemo(() => {
    if (activeFilter === 'todos') return undefined;
    return NEWS_FEED_TAG[activeFilter];
  }, [activeFilter]);

  const fetchPage = useCallback(
    async (offset: number) => {
      const list = await getNews({
        status: 'published',
        tag: feedTag,
        init: offset,
        end: offset + PAGE_SIZE,
      });
      const page = sortNovidadesByDate(list.map(newsItemToNovidade));
      return { items: page };
    },
    [feedTag],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: page } = await fetchPage(0);
      setItems(page);
      setImageEpoch(Date.now());
      setHasMore(page.length === PAGE_SIZE);
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
      const offset = itemsLengthRef.current;
      const { items: page } = await fetchPage(offset);
      setItems((prev) => sortNovidadesByDate([...prev, ...page]));
      setHasMore(page.length === PAGE_SIZE);
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
