import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/services/authApi';
import { getNotificationsUnreadCount } from '@/services/notificationApi';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';


export function useNotificationUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user || !getAuthToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const { count } = await getNotificationsUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { unreadCount, refresh };
}
