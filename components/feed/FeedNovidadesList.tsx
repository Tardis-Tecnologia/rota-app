import FeedMuralHeader from '@/components/feed/FeedMuralHeader';
import FeedNovidadeCard from '@/components/feed/FeedNovidadeCard';
import { AppColors } from '@/constants/theme';
import {
  getNews,
  NEWS_FEED_TAG,
  newsItemToNovidade,
  sortNovidadesByDate,
} from '@/services/newsApi';
import { FeedFilter } from '@/types';
import type { FeedNovidade } from '@/types/feedNovidade';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PAGE_SIZE = 10;

export default function FeedNovidadesList() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('todos');
  const [items, setItems] = useState<FeedNovidade[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const itemsLengthRef = useRef(0);
  itemsLengthRef.current = items.length;

  const feedTag = useMemo(() => {
    if (activeFilter === 'todos') return undefined;
    return NEWS_FEED_TAG[activeFilter];
  }, [activeFilter]);

  const fetchPage = useCallback(
    async (offset: number) => {
      const list = await getNews({
        status: 'published',
        tag: feedTag,
        init: offset,
        end: offset + PAGE_SIZE,
      });
      const page = sortNovidadesByDate(list.map(newsItemToNovidade));
      return { items: page };
    },
    [feedTag],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: page } = await fetchPage(0);
      setItems(page);
      setImageEpoch(Date.now());
      setHasMore(page.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as novidades.');
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const offset = itemsLengthRef.current;
      const { items: page } = await fetchPage(offset);
      setItems((prev) => sortNovidadesByDate([...prev, ...page]));
      setHasMore(page.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar mais novidades.');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  const renderItem: ListRenderItem<FeedNovidade> = useCallback(
    ({ item }) => (
      <FeedNovidadeCard
        item={item}
        imageCacheEpoch={imageEpoch}
        onOpenDetail={() =>
          router.push({
            pathname: '/novidade/[id]',
            params: { id: item.id },
          })
        }
      />
    ),
    [imageEpoch],
  );

  const listHeader = useMemo(
    () => <FeedMuralHeader activeFilter={activeFilter} onSelectFilter={setActiveFilter} />,
    [activeFilter],
  );

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.centerText}>Carregando mural…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerBlock}>
          <Ionicons name="cloud-offline-outline" size={40} color={AppColors.text.quaternary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadInitial()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centerBlock}>
        <Ionicons name="newspaper-outline" size={44} color={AppColors.text.quaternary} />
        <Text style={styles.emptyTitle}>Nenhuma novidade por aqui</Text>
        <Text style={styles.emptyHint}>
          Quando a Prefeitura publicar comunicados nesta categoria, eles aparecerão neste mural.
        </Text>
      </View>
    );
  }, [error, loadInitial, loading]);

  const listFooter = useMemo(() => {
    if (!loadingMore) return <View style={{ height: 24 }} />;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={AppColors.primary} />
        <Text style={styles.footerText}>Carregando mais…</Text>
      </View>
    );
  }, [loadingMore]);

  return (
    <FlatList
      data={items}
      key={activeFilter}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={listFooter}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
      onEndReached={() => void loadMore()}
      onEndReachedThreshold={0.35}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f1f5f9' },
  listContent: {
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  centerBlock: {
    minHeight: 200,
    paddingHorizontal: 32,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: AppColors.status.error,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    fontWeight: '600',
  },
});
