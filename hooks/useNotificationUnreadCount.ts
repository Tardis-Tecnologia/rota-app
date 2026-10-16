import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/services/authApi';
import { getNotificationsUnreadCount } from '@/services/notificationApi';
import { shouldAppRefetch } from '@/utils/appRefreshPolicy';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

export function useNotificationUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastLoadedAtRef = useRef(0);

  const refresh = useCallback(
    async (force = false) => {
      if (!user || !getAuthToken()) {
        setUnreadCount(0);
        return;
      }
      if (!force && !shouldAppRefetch(lastLoadedAtRef.current, { hasData: true })) {
        return;
      }
      try {
        const { count } = await getNotificationsUnreadCount();
        setUnreadCount(count);
        lastLoadedAtRef.current = Date.now();
      } catch {
        setUnreadCount(0);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
    }, [refresh]),
  );

  return { unreadCount, refresh: () => refresh(true) };
}
