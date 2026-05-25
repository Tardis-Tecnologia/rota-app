import { useAuth } from '@/contexts/AuthContext';
import {
  getMyEventFavorite,
  listMyFavoriteEvents,
  toggleEventFavorite,
  type EventFavoriteApiError,
} from '@/services/eventFavoritesService';
import type { EventListItem } from '@/utils/eventPresentation';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useSavedEvents() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set());
      setReady(true);
      return;
    }
    try {
      const rows = await listMyFavoriteEvents(0, 100);
      setSavedIds(new Set(rows.map((r) => r.event.id)));
    } catch {
      setSavedIds(new Set());
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isSaved = useCallback((eventId: string) => savedIds.has(eventId), [savedIds]);

  const toggleSaved = useCallback(
    async (item: EventListItem) => {
      if (!user) {
        Alert.alert('Entrar na conta', 'Faça login para salvar eventos nos favoritos.');
        return false;
      }
      const wasSaved = savedIds.has(item.id);
      try {
        const nowSaved = await toggleEventFavorite(item.id, wasSaved);
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (nowSaved) next.add(item.id);
          else next.delete(item.id);
          return next;
        });
        return nowSaved;
      } catch (e) {
        const message =
          e instanceof EventFavoriteApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Não foi possível atualizar os favoritos.';
        Alert.alert('Eventos salvos', message);
        return wasSaved;
      }
    },
    [savedIds, user],
  );

  const checkSaved = useCallback(
    async (eventId: string) => {
      if (!user) return false;
      try {
        const status = await getMyEventFavorite(eventId);
        if (status.favorited) {
          setSavedIds((prev) => new Set(prev).add(eventId));
        }
        return status.favorited;
      } catch {
        return isSaved(eventId);
      }
    },
    [isSaved, user],
  );

  return { isSaved, toggleSaved, reload, ready, checkSaved };
}
