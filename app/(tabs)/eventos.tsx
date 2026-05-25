import EventCategoryChips from '@/components/events/EventCategoryChips';
import EventFeaturedCarousel from '@/components/events/EventFeaturedCarousel';
import EventUpcomingCard from '@/components/events/EventUpcomingCard';
import { AppColors } from '@/constants/theme';
import { getEvents } from '@/services/eventsService';
import type { EventCategoryKey, EventListItem } from '@/utils/eventPresentation';
import { eventItemToListItem } from '@/utils/eventPresentation';
import { startOfLocalDay } from '@/utils/eventsCarousel';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PAGE_SIZE = 10;

export default function EventosScreen() {
  const [items, setItems] = useState<EventListItem[]>([]);
  const [featured, setFeatured] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EventCategoryKey>('todos');

  const itemsLengthRef = useRef(0);
  itemsLengthRef.current = items.length;

  const startDate = useMemo(() => startOfLocalDay().toISOString(), []);

  const categoriesQuery = useMemo(
    () => (activeCategory === 'todos' ? undefined : String(activeCategory)),
    [activeCategory],
  );

  const fetchPage = useCallback(
    async (offset: number) => {
      return getEvents({
        init: offset,
        end: offset + PAGE_SIZE,
        startDate,
        ...(categoriesQuery ? { categories: categoriesQuery } : {}),
      });
    },
    [startDate, categoriesQuery],
  );

  const fetchFeatured = useCallback(async () => {
    const list = await getEvents({
      init: 0,
      end: 8,
      featured: true,
      startDate,
      ...(categoriesQuery ? { categories: categoriesQuery } : {}),
    });
    return list.map(eventItemToListItem);
  }, [startDate, categoriesQuery]);

  const loadEvents = useCallback(async () => {
    setItems([]);
    setLoading(true);
    try {
      const [list, featuredList] = await Promise.all([fetchPage(0), fetchFeatured()]);
      const mapped = list.map(eventItemToListItem);
      setItems(mapped);
      setFeatured(featuredList);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setItems([]);
      setFeatured([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, fetchFeatured]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [list, featuredList] = await Promise.all([fetchPage(0), fetchFeatured()]);
      const mapped = list.map(eventItemToListItem);
      setItems(mapped);
      setFeatured(featuredList);
      setHasMore(list.length === PAGE_SIZE);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage, fetchFeatured]);

  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      const offset = itemsLengthRef.current;
      const list = await fetchPage(offset);
      const mapped = list.map(eventItemToListItem);
      setItems((prev) => [...prev, ...mapped]);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Não foi possível carregar mais eventos.';
      Alert.alert('Erro', message);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore, refreshing]);

  const featuredIds = useMemo(() => new Set(featured.map((e) => e.id)), [featured]);
  const upcomingItems = useMemo(
    () => items.filter((e) => !featuredIds.has(e.id)),
    [items, featuredIds],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <EventFeaturedCarousel items={featured.length > 0 ? featured : items.filter((e) => e.featured).slice(0, 5)} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos eventos</Text>
          <Text style={styles.sectionLink}>Ver todos</Text>
        </View>
      </View>
    ),
    [featured, items],
  );

  return (
    <View style={styles.container}>
      <EventCategoryChips active={activeCategory} onSelect={setActiveCategory} />
      <FlatList
        style={styles.list}
        data={upcomingItems}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (!loadingMore && hasMore && !loading && !refreshing) void loadMoreEvents();
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading && !refreshing ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={AppColors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Tente outro filtro, volte mais tarde ou puxe para atualizar.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={AppColors.primary} />
            </View>
          ) : (
            <View style={styles.footer} />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <EventUpcomingCard item={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.tab.active,
  },
  cardWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
