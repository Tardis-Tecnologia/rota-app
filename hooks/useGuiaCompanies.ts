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
import { distanceMeters } from '@/utils/guiaGeo';
import {
  coordsKey,
  GUIA_COORDS_INVALIDATE_METERS,
  shouldGuiaReload,
} from '@/utils/guiaReloadPolicy';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const GUIA_EMPRESAS_PAGE_SIZE = 15;
/** Carrega empresas/comércio geral de cara (não só restaurantes). */
const INITIAL_CATEGORIES = 4;
const PARALLEL_CATEGORIES = 3;

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
  const lastLoadedAtRef = useRef(0);
  const lastCoordsKeyRef = useRef<string | null>(null);
  const lastFetchCoordsRef = useRef(resolveGuiaPlacesFetchCoords(userCoords));
  const allItemsRef = useRef(allItems);
  allItemsRef.current = allItems;

  const fetchCoords = useMemo(
    () => resolveGuiaPlacesFetchCoords(userCoords),
    [userCoords?.latitude, userCoords?.longitude],
  );
  const sortOrigin = userCoords ?? fetchCoords;
  const totalCategories = totalGuiaEmpresaCategories();
  const isSearching = searchQuery.trim().length > 0;
  const hasMore = visibleCount < allItems.length || nextCategoryIndex < totalCategories;
  const items = isSearching ? allItems : allItems.slice(0, visibleCount);

  const fetchCategoriesParallel = useCallback(
    async (
      startIndex: number,
      count: number,
      previous: GuiaListItem[],
      generation: number,
    ): Promise<{ merged: GuiaListItem[]; nextIndex: number; lastError: string | null }> => {
      const indices: number[] = [];
      for (let i = 0; i < count && startIndex + i < totalCategories; i += 1) {
        indices.push(startIndex + i);
      }
      if (indices.length === 0) {
        return { merged: previous, nextIndex: startIndex, lastError: null };
      }

      if (generation === fetchGeneration.current) {
        setLoadingCategoryLabel(getGuiaEmpresaCategoryLabel(indices[0]) ?? 'Empresas');
      }

      const batches = await Promise.all(
        indices.map((index) => fetchGuiaEmpresaCategory(fetchCoords, index)),
      );

      if (generation !== fetchGeneration.current) {
        return { merged: previous, nextIndex: startIndex, lastError: null };
      }

      let merged = previous;
      let nextIndex = startIndex;
      let lastError: string | null = null;

      for (const batch of batches) {
        nextIndex = Math.max(nextIndex, batch.nextCategoryIndex);
        if (batch.error) lastError = batch.error;
        if (batch.items.length > 0) {
          merged = mergeGuiaCompanyItems(merged, batch.items, sortOrigin);
        }
      }

      setLoadingCategoryLabel(null);
      return { merged, nextIndex, lastError };
    },
    [fetchCoords.latitude, fetchCoords.longitude, sortOrigin.latitude, sortOrigin.longitude, totalCategories],
  );

  const regionChanged = useCallback(() => {
    const key = coordsKey(fetchCoords);
    if (lastCoordsKeyRef.current === null) return true;
    if (lastCoordsKeyRef.current !== key) {
      const meters = distanceMeters(
        lastFetchCoordsRef.current.latitude,
        lastFetchCoordsRef.current.longitude,
        fetchCoords.latitude,
        fetchCoords.longitude,
      );
      return meters >= GUIA_COORDS_INVALIDATE_METERS;
    }
    return false;
  }, [fetchCoords.latitude, fetchCoords.longitude]);

  const reload = useCallback(
    async (force = false) => {
      if (!enabled) return;

      const key = coordsKey(fetchCoords);
      const moved = regionChanged();

      if (
        !force &&
        !moved &&
        lastCoordsKeyRef.current === key &&
        allItemsRef.current.length > 0 &&
        !shouldGuiaReload(lastLoadedAtRef.current, { hasData: true })
      ) {
        return;
      }

      const generation = ++fetchGeneration.current;
      const resetList = moved || allItemsRef.current.length === 0;

      if (moved) clearGuiaPlacesCache();
      lastCoordsKeyRef.current = key;
      lastFetchCoordsRef.current = fetchCoords;

      if (resetList) {
        setAllItems([]);
        setVisibleCount(0);
        setNextCategoryIndex(0);
      }

      setLoading(allItemsRef.current.length === 0 || resetList);
      setError(null);

      try {
        const { merged, nextIndex, lastError } = await fetchCategoriesParallel(
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

        lastLoadedAtRef.current = Date.now();
      } catch (e) {
        if (generation !== fetchGeneration.current) return;
        if (allItemsRef.current.length === 0) {
          setError(formatGuiaPlacesError(e instanceof Error ? e.message : 'Erro ao carregar empresas.'));
        }
      } finally {
        if (generation === fetchGeneration.current) {
          setLoading(false);
          setLoadingCategoryLabel(null);
        }
      }
    },
    [enabled, fetchCoords.latitude, fetchCoords.longitude, fetchCategoriesParallel, regionChanged],
  );

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
      const { merged, nextIndex, lastError } = await fetchCategoriesParallel(
        nextCategoryIndex,
        PARALLEL_CATEGORIES,
        allItems,
        generation,
      );
      if (generation !== fetchGeneration.current) return;
      setAllItems(merged);
      setNextCategoryIndex(nextIndex);
      setVisibleCount((n) => Math.min(n + GUIA_EMPRESAS_PAGE_SIZE, merged.length));
      if (lastError && merged.length === allItems.length) setError(lastError);
      lastLoadedAtRef.current = Date.now();
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
    fetchCategoriesParallel,
  ]);

  const reloadIfStale = useCallback((force = false) => reload(force), [reload]);

  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    if (enabled) void reloadRef.current(allItemsRef.current.length === 0);
  }, [enabled, fetchCoords.latitude, fetchCoords.longitude]);

  return {
    items,
    totalLoaded: allItems.length,
    loading,
    loadingMore,
    loadingCategoryLabel,
    error,
    hasMore,
    reload: () => reload(true),
    reloadIfStale,
    loadMore,
  };
}
