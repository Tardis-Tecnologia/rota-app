import NotificationsList from '@/components/NotificationComponent';
import { AppColors } from '@/constants/theme';
import type { NotificationDto } from '@/services/notificationApi';
import {
  getNotifications,
  isNotificationUnreadDto,
  markNotificationRead,
  NOTIFICATIONS_PAGE_SIZE,
} from '@/services/notificationApi';
import { isCommercialAccessToken } from '@/utils/comercioAuth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<NotificationDto[]>([]);
  itemsRef.current = items;

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'append') => {
    if (mode === 'initial') {
      setLoading(true);
    } else if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const prevLen = mode === 'append' ? itemsRef.current.length : 0;
      const offset = mode === 'append' ? prevLen : 0;
      const { items: page, total: totalFromApi } = await getNotifications({
        init: offset,
        end: offset + NOTIFICATIONS_PAGE_SIZE,
      });

      const nextLen = mode === 'append' ? prevLen + page.length : page.length;
      const more =
        totalFromApi !== null
          ? nextLen < totalFromApi
          : page.length === NOTIFICATIONS_PAGE_SIZE;

      setHasMore(more);
      if (mode === 'append') {
        setItems((prev) => [...prev, ...page]);
      } else {
        setItems(page);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Não foi possível carregar as notificações.';
      setError(message);
    } finally {
      if (mode === 'initial') {
        setLoading(false);
      } else if (mode === 'refresh') {
        setRefreshing(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void load('initial');
  }, [load]);

  const onRefresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  const onLoadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    void load('append');
  }, [hasMore, load, loading, loadingMore, refreshing]);

  const onPressItem = useCallback(
    async (item: NotificationDto) => {
      if (item.channelType === 'forum_community' && item.channelId) {
        router.push({
          pathname: '/forum/communities/[id]',
          params: { id: item.channelId },
        });
      } else if (item.channelType && item.channelId) {
        router.push({
          pathname: '/ChatTab',
          params: {
            provider: JSON.stringify({
              id: 'prefeitura',
              name: 'Prefeitura',
              channelType: item.channelType,
              channelId: item.channelId,
            }),
            ...(isCommercialAccessToken() ? { returnTo: '/comerciante/mensagens' } : {}),
          },
        });
      }
      if (!isNotificationUnreadDto(item)) return;
      const optimisticAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, isRead: true, readAt: optimisticAt } : n,
        ),
      );
      try {
        const res = await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, isRead: true, readAt: res.readAt } : n,
          ),
        );
      } catch {
        await load('refresh');
      }
    },
    [load],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="arrow-back-outline" size={22} marginLeft={20} marginTop={10} color={AppColors.text.secondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 36 }} />
      </View>

      <NotificationsList
        items={items}
        loading={loading}
        error={error}
        refreshing={refreshing}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onRefresh={onRefresh}
        onLoadMore={onLoadMore}
        onRetry={() => void load('initial')}
        onPressItem={onPressItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.overlay,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
});
