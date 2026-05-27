import { getAuthToken } from '@/services/authApi';
import {
  getMyServiceProviders,
  listPublicServiceProviders,
} from '@/services/serviceProvidersApi';
import type { GuiaListItem } from '@/services/guiaCatalog';
import { mergeGuiaProviderLists } from '@/utils/serviceProviderMappers';
import { useCallback, useEffect, useState } from 'react';

export function useGuiaProviders(enabled: boolean, currentUserId?: string | null) {
  const [items, setItems] = useState<GuiaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const publicPromise = listPublicServiceProviders().catch(() => [] as Awaited<ReturnType<typeof listPublicServiceProviders>>);
      const myPromise =
        getAuthToken()
          ? getMyServiceProviders().catch(() => [] as Awaited<ReturnType<typeof getMyServiceProviders>>)
          : Promise.resolve([]);
      const [publicItems, myItems] = await Promise.all([publicPromise, myPromise]);
      setItems(mergeGuiaProviderLists(publicItems, myItems, currentUserId));
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar prestadores.');
    } finally {
      setLoading(false);
    }
  }, [enabled, currentUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}
