import MarketplaceCategoryFilter from '@/components/marketplace/MarketplaceCategoryFilter';
import MarketplaceHeroBanner from '@/components/marketplace/MarketplaceHeroBanner';
import MarketplaceProductCard from '@/components/marketplace/MarketplaceProductCard';
import MarketplaceSearchBar from '@/components/marketplace/MarketplaceSearchBar';
import { AppColors } from '@/constants/theme';
import { listMarketplaceListings } from '@/services/marketplaceApi';
import type { MarketplaceListFilter, MarketplaceListing } from '@/types/marketplace';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PAGE_SIZE = 20;

export default function MarketplaceIndexScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MarketplaceListFilter>('todos');
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const itemsLengthRef = useRef(0);
  itemsLengthRef.current = items.length;

  const fetchPage = useCallback(
    async (offset: number) =>
      listMarketplaceListings({
        category: category === 'todos' ? undefined : category,
        search: search.trim() || undefined,
        init: offset,
        end: offset + PAGE_SIZE,
      }),
    [category, search],
  );

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const list = await fetchPage(0);
      setItems(list);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      setItems([]);
      setHasMore(false);
      setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar os anúncios.');
    }
  }, [fetchPage]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      const offset = itemsLengthRef.current;
      const list = await fetchPage(offset);
      setItems((prev) => [...prev, ...list]);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore, refreshing]);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <MarketplaceHeroBanner variant="citizen" />
        <MarketplaceSearchBar value={search} onChangeText={setSearch} />
        <MarketplaceCategoryFilter active={category} onSelect={setCategory} />
      </View>
    ),
    [category, search],
  );

  const empty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      );
    }
    if (loadError) {
      return (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={AppColors.status.error} />
          <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
          <Text style={styles.emptyHint}>{loadError}</Text>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Ionicons name="cube-outline" size={44} color={AppColors.text.quaternary} />
        <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
        <Text style={styles.emptyHint}>Tente outro termo de busca ou categoria.</Text>
      </View>
    );
  }, [loadError, loading]);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        key={`${category}-${search}`}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={index === 0 ? styles.firstCardWrap : undefined}>
            <MarketplaceProductCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/marketplace/[id]',
                  params: { id: item.id },
                })
              }
            />
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#7c3aed" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.35}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  listHeader: {
    paddingBottom: 4,
  },
  firstCardWrap: {
    marginTop: 4,
  },
  listContent: { paddingBottom: 32, flexGrow: 1 },
  center: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 10,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
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
});
