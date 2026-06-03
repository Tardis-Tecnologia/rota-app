import { getAuthToken } from '@/services/authApi';
import {
  getMyServiceProviders,
  listPublicServiceProviders,
} from '@/services/serviceProvidersApi';
import type { GuiaListItem } from '@/services/guiaCatalog';
import { shouldGuiaReload } from '@/utils/guiaReloadPolicy';
import { mergeGuiaProviderLists } from '@/utils/serviceProviderMappers';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useGuiaProviders(enabled: boolean, currentUserId?: string | null) {
  const [items, setItems] = useState<GuiaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAtRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = useCallback(
    async (force = false) => {
      if (!enabled) return;
      if (
        !shouldGuiaReload(lastLoadedAtRef.current, {
          force,
          hasData: itemsRef.current.length > 0,
        })
      ) {
        return;
      }

      const showSpinner = itemsRef.current.length === 0;
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const publicPromise = listPublicServiceProviders().catch(
          () => [] as Awaited<ReturnType<typeof listPublicServiceProviders>>,
        );
        const myPromise = getAuthToken()
          ? getMyServiceProviders().catch(
              () => [] as Awaited<ReturnType<typeof getMyServiceProviders>>,
            )
          : Promise.resolve([]);
        const [publicItems, myItems] = await Promise.all([publicPromise, myPromise]);
        setItems(mergeGuiaProviderLists(publicItems, myItems, currentUserId));
        lastLoadedAtRef.current = Date.now();
      } catch (e) {
        if (itemsRef.current.length === 0) {
          setItems([]);
          setError(e instanceof Error ? e.message : 'Não foi possível carregar prestadores.');
        }
      } finally {
        setLoading(false);
      }
    },
    [enabled, currentUserId],
  );

  const reloadIfStale = useCallback((force = false) => load(force), [load]);

  useEffect(() => {
    if (enabled) void load(itemsRef.current.length === 0);
  }, [enabled, currentUserId, load]);

  return { items, loading, error, reload: () => load(true), reloadIfStale };
}
