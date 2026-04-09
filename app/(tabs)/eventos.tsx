import FilterTabs, { FilterOption } from '@/components/FilterTabs';
import { AppColors } from '@/constants/theme';
import { getEvents } from '@/services/eventsService';
import type { EventItem } from '@/services/eventsService';
import type { Evento } from '@/types';
import { eventItemToEvento, formatEventCardDateLine, startOfLocalDay } from '@/utils/eventsCarousel';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PAGE_SIZE = 10;

const EVENT_CATEGORY_FILTERS: Array<FilterOption> = [
  { key: 'todos', label: 'Todos' },
  { key: 'cultural', label: 'Cultural' },
  { key: 'festividade', label: 'Festividade' },
  { key: 'show', label: 'Show' },
  { key: 'feira', label: 'Feira' },
];

type EventoListItem = Evento & { descricao?: string; localNome?: string; endereco?: string };

function eventItemToEventoListItem(item: EventItem): EventoListItem {
  const base = eventItemToEvento(item);
  const descricao = item.description?.trim() || undefined;
  const localNome = item.locationName?.trim() || undefined;
  const endereco = item.locationAddress?.trim() || undefined;
  return { ...base, descricao, localNome, endereco };
}


function formatLocalLine(item: EventoListItem): string {
  const nome = item.localNome?.trim();
  const end = item.endereco?.trim();
  if (nome && end) return `Local: ${nome} (${end})`;
  if (nome) return `Local: ${nome}`;
  if (end) return `Local: ${end}`;
  const fallback = item.local?.trim();
  if (!fallback || fallback === 'Local a definir') return 'Local a definir';
  return `Local: ${fallback}`;
}

export default function EventosScreen() {
  const [items, setItems] = useState<EventoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  const itemsLengthRef = useRef(0);
  itemsLengthRef.current = items.length;

  const startDate = useMemo(() => startOfLocalDay().toISOString(), []);

  const categoriesQuery = useMemo(
    () => (activeCategory === 'todos' ? undefined : activeCategory),
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

  const loadEvents = useCallback(async () => {
    setItems([]);
    setLoading(true);
    try {
      const list = await fetchPage(0);
      const mapped = list.map(eventItemToEventoListItem);
      setItems(mapped);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await fetchPage(0);
      const mapped = list.map(eventItemToEventoListItem);
      setItems(mapped);
      setHasMore(list.length === PAGE_SIZE);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      const offset = itemsLengthRef.current;
      const list = await fetchPage(offset);
      const mapped = list.map(eventItemToEventoListItem);
      setItems((prev) => [...prev, ...mapped]);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Não foi possível carregar mais eventos.';
      Alert.alert('Erro', message);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore, refreshing]);

  const handleEndReached = useCallback(() => {
    if (loadingMore || !hasMore || loading || refreshing) return;
    void loadMoreEvents();
  }, [loadMoreEvents, loadingMore, hasMore, loading, refreshing]);

  const handleSelectCategory = useCallback((key: string) => {
    setActiveCategory(key);
  }, []);

  return (
    <View style={styles.container}>
      <FilterTabs
        filters={EVENT_CATEGORY_FILTERS}
        active={activeCategory}
        onSelect={handleSelectCategory}
        containerStyle={styles.filterTabsOuter}
      />
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
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
          <TouchableOpacity activeOpacity={0.8} style={styles.card}>
            {item.imagem ? (
              <Image source={{ uri: item.imagem }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.dateLine}>{formatEventCardDateLine(item)}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.descricao ? (
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {item.descricao}
                </Text>
              ) : null}
              <Text style={styles.cardLocationLine} numberOfLines={3}>
                {formatLocalLine(item)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  filterTabsOuter: {
    paddingBottom: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
    flexGrow: 1,
  },
  emptyState: {
    paddingVertical: 48,
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
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: AppColors.gray[300],
  },
  cardImagePlaceholder: {
    backgroundColor: AppColors.gray[200],
  },
  cardContent: {
    padding: 16,
  },
  dateLine: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.tab.active,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.text.tertiary,
    marginBottom: 8,
  },
  cardLocationLine: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: AppColors.text.secondary,
  },
});

