import { showSavedEventToast } from '@/components/events/SavedEventToastHost';
import { useAuth } from '@/contexts/AuthContext';
import {
  EventFavoriteApiError,
  isEventFavorited,
  listMyFavoriteEvents,
  toggleEventFavorite,
} from '@/services/eventFavoritesService';
import type { EventListItem } from '@/utils/eventPresentation';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

function savedToastMessage(titulo: string): string {
  const name = titulo.trim();
  if (!name) return 'Evento salvo nos favoritos';
  if (name.length > 32) return 'Evento salvo nos favoritos';
  return `“${name}” salvo nos favoritos`;
}

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
      setSavedIds(new Set(rows.map((r) => r.eventId || r.event.id)));
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
      const eventId = item.id?.trim();
      if (!eventId) {
        Alert.alert('Eventos salvos', 'Não foi possível identificar este evento.');
        return false;
      }
      const wasSaved = savedIds.has(eventId);
      try {
        const nowSaved = await toggleEventFavorite(eventId, wasSaved, item.hostId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (nowSaved) next.add(eventId);
          else next.delete(eventId);
          return next;
        });
        if (nowSaved) {
          showSavedEventToast(savedToastMessage(item.titulo), 'success');
        }
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
    async (eventId: string, hostId?: string) => {
      if (!user) return false;
      if (savedIds.has(eventId)) return true;
      try {
        const favorited = await isEventFavorited(eventId, hostId);
        if (favorited) {
          setSavedIds((prev) => new Set(prev).add(eventId));
        }
        return favorited;
      } catch {
        return isSaved(eventId);
      }
    },
    [isSaved, savedIds, user],
  );

  return { isSaved, toggleSaved, reload, ready, checkSaved };
}
