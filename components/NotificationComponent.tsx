import { AppColors } from '@/constants/theme';
import type { NotificationDto } from '@/services/notificationApi';
import { isNotificationUnreadDto } from '@/services/notificationApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type NotificationsListProps = {
  items: NotificationDto[];
  loading: boolean;
  error: string | null;
  refreshing?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onPressItem?: (item: NotificationDto) => void | Promise<void>;
};

function formatNotificationDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  items,
  loading,
  error,
  refreshing = false,
  loadingMore = false,
  hasMore = false,
  onRefresh,
  onLoadMore,
  onRetry,
  onPressItem,
}) => {
  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryLabel}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const renderItem = ({ item }: { item: NotificationDto }) => {
    const unread = isNotificationUnreadDto(item);
    return (
      <Pressable
        onPress={onPressItem ? () => void onPressItem(item) : undefined}
        disabled={!onPressItem}
        style={({ pressed }) => [
          styles.card,
          unread && styles.cardUnread,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={AppColors.primary} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              {unread ? <View style={styles.unreadDot} /> : null}
              <Text style={[styles.cardTitle, unread && styles.cardTitleUnread]} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
            <Text style={styles.cardDate}>{formatNotificationDate(item.createdAt)}</Text>
          </View>
          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={4}>
              {item.description}
            </Text>
          ) : null}
          {item.channelType === 'forum_community' && item.channelId ? (
            <Text style={styles.cardDescription}>Toque para abrir a comunidade</Text>
          ) : item.channelId ? (
            <Text style={styles.cardDescription}>Toque para abrir a mensagem</Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />
          ) : undefined
        }
        onEndReached={() => {
          if (hasMore && onLoadMore && !loadingMore && !loading) {
            onLoadMore();
          }
        }}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma notificação por aqui.</Text>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={AppColors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default NotificationsList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: AppColors.background.light,
  },
  errorText: {
    fontSize: 15,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: AppColors.background.overlay,
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.primary,
  },
  emptyText: {
    fontSize: 15,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginHorizontal: 10,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: AppColors.background.overlay,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    marginTop: 6,
    marginRight: 8,
    flexShrink: 0,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.quaternary,
    textTransform: 'capitalize',
  },
  cardDescription: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    lineHeight: 20,
  },
});
