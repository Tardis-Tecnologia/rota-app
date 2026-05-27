import type { GuiaListItem } from '@/services/guiaCatalog';
import {
  clearGuiaPlacesCache,
  fetchGuiaEmpresaCategory,
  formatGuiaPlacesError,
  getGuiaEmpresaCategoryLabel,
  mergeGuiaCompanyItems,
  resolveGuiaPlacesFetchCoords,
  totalGuiaEmpresaCategories,
} from '@/services/guiaPlacesCatalog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const GUIA_EMPRESAS_PAGE_SIZE = 15;
const INITIAL_CATEGORIES = 2;

export function useGuiaCompanies(
  enabled: boolean,
  userCoords?: { latitude: number; longitude: number } | null,
  searchQuery = '',
) {
  const [allItems, setAllItems] = useState<GuiaListItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [nextCategoryIndex, setNextCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategoryLabel, setLoadingCategoryLabel] = useState<string | null>(null);
  const fetchGeneration = useRef(0);

  const fetchCoords = useMemo(
    () => resolveGuiaPlacesFetchCoords(userCoords),
    [userCoords?.latitude, userCoords?.longitude],
  );
  const sortOrigin = userCoords ?? fetchCoords;
  const totalCategories = totalGuiaEmpresaCategories();
  const isSearching = searchQuery.trim().length > 0;
  const hasMore = visibleCount < allItems.length || nextCategoryIndex < totalCategories;
  const items = isSearching ? allItems : allItems.slice(0, visibleCount);

  const fetchCategoriesFromIndex = useCallback(
    async (
      startIndex: number,
      count: number,
      previous: GuiaListItem[],
      generation: number,
    ): Promise<{ merged: GuiaListItem[]; nextIndex: number; lastError: string | null }> => {
      let merged = previous;
      let index = startIndex;
      let lastError: string | null = null;
      let fetched = 0;

      while (fetched < count && index < totalCategories) {
        if (generation !== fetchGeneration.current) break;
        setLoadingCategoryLabel(getGuiaEmpresaCategoryLabel(index));
        const { items: batch, nextCategoryIndex: nextIdx, error: catError } =
          await fetchGuiaEmpresaCategory(fetchCoords, index);
        index = nextIdx;
        fetched += 1;
        if (catError) lastError = catError;
        if (batch.length > 0) merged = mergeGuiaCompanyItems(merged, batch, sortOrigin);
      }
      setLoadingCategoryLabel(null);
      return { merged, nextIndex: index, lastError };
    },
    [fetchCoords.latitude, fetchCoords.longitude, sortOrigin.latitude, sortOrigin.longitude, totalCategories],
  );

  const reload = useCallback(async () => {
    if (!enabled) return;
    const generation = ++fetchGeneration.current;
    setLoading(true);
    setError(null);
    setAllItems([]);
    setVisibleCount(0);
    setNextCategoryIndex(0);
    clearGuiaPlacesCache();
    try {
      const { merged, nextIndex, lastError } = await fetchCategoriesFromIndex(
        0,
        INITIAL_CATEGORIES,
        [],
        generation,
      );
      if (generation !== fetchGeneration.current) return;
      setAllItems(merged);
      setNextCategoryIndex(nextIndex);
      setVisibleCount(Math.min(GUIA_EMPRESAS_PAGE_SIZE, merged.length));
      if (merged.length === 0 && lastError) setError(lastError);
      else if (merged.length === 0) setError('Nenhuma empresa encontrada no mapa para esta região.');
    } catch (e) {
      if (generation !== fetchGeneration.current) return;
      setError(formatGuiaPlacesError(e instanceof Error ? e.message : 'Erro ao carregar empresas.'));
    } finally {
      if (generation === fetchGeneration.current) {
        setLoading(false);
        setLoadingCategoryLabel(null);
      }
    }
  }, [enabled, fetchCategoriesFromIndex]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || !hasMore) return;
    if (visibleCount < allItems.length) {
      setVisibleCount((n) => Math.min(n + GUIA_EMPRESAS_PAGE_SIZE, allItems.length));
      return;
    }
    if (nextCategoryIndex >= totalCategories) return;
    setLoadingMore(true);
    const generation = fetchGeneration.current;
    try {
      const { merged, nextIndex, lastError } = await fetchCategoriesFromIndex(
        nextCategoryIndex,
        1,
        allItems,
        generation,
      );
      if (generation !== fetchGeneration.current) return;
      setAllItems(merged);
      setNextCategoryIndex(nextIndex);
      setVisibleCount((n) => Math.min(n + GUIA_EMPRESAS_PAGE_SIZE, merged.length));
      if (lastError && merged.length === allItems.length) setError(lastError);
    } catch (e) {
      setError(formatGuiaPlacesError(e instanceof Error ? e.message : 'Erro ao carregar mais.'));
    } finally {
      setLoadingMore(false);
      setLoadingCategoryLabel(null);
    }
  }, [
    enabled,
    loading,
    loadingMore,
    hasMore,
    visibleCount,
    allItems,
    nextCategoryIndex,
    totalCategories,
    fetchCategoriesFromIndex,
  ]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled || !isSearching || loading || loadingMore || nextCategoryIndex >= totalCategories) {
      return;
    }
    void loadMore();
  }, [
    enabled,
    isSearching,
    loading,
    loadingMore,
    nextCategoryIndex,
    totalCategories,
    loadMore,
  ]);

  useEffect(() => {
    if (!enabled) {
      setAllItems([]);
      setVisibleCount(0);
      setNextCategoryIndex(0);
      setError(null);
    }
  }, [enabled]);

  return {
    items,
    totalLoaded: allItems.length,
    loading,
    loadingMore,
    loadingCategoryLabel,
    error,
    hasMore,
    reload,
    loadMore,
  };
}
