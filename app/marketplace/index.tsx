import MarketplaceCategoryFilter from '@/components/marketplace/MarketplaceCategoryFilter';
import MarketplaceHeroBanner from '@/components/marketplace/MarketplaceHeroBanner';
import MarketplaceProductCard from '@/components/marketplace/MarketplaceProductCard';
import MarketplaceSearchBar from '@/components/marketplace/MarketplaceSearchBar';
import MarketplaceSegmentTabs, {
  type MarketplaceSegment,
} from '@/components/marketplace/MarketplaceSegmentTabs';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { listMarketplaceListings, listMyMarketplaceListings } from '@/services/marketplaceApi';
import type { MarketplaceListFilter, MarketplaceListing } from '@/types/marketplace';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PAGE_SIZE = 20;

export default function MarketplaceIndexScreen() {
  const { user } = useAuth();
  const isVisitante = useIsVisitante();
  const [segment, setSegment] = useState<MarketplaceSegment>('todos');
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
    async (offset: number) => {
      if (segment === 'meus') {
        if (isVisitante) return [];
        return listMyMarketplaceListings({ init: offset, end: offset + PAGE_SIZE });
      }
      return listMarketplaceListings({
        category: category === 'todos' ? undefined : category,
        search: search.trim() || undefined,
        init: offset,
        end: offset + PAGE_SIZE,
      });
    },
    [category, isVisitante, search, segment],
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

  const filteredMeusItems = useMemo(() => {
    if (segment !== 'meus') return items;
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.locationName.toLowerCase().includes(q);
      const matchesCategory = category === 'todos' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, items, search, segment]);

  const displayItems = segment === 'meus' ? filteredMeusItems : items;

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <MarketplaceHeroBanner />
        <MarketplaceSegmentTabs
          active={segment}
          onChange={(next) => {
            if (next === 'meus' && isVisitante) {
              promptVisitanteLogin('gerenciar seus anúncios');
              return;
            }
            setSegment(next);
          }}
        />
        <MarketplaceSearchBar value={search} onChangeText={setSearch} />
        <MarketplaceCategoryFilter active={category} onSelect={setCategory} />
      </View>
    ),
    [category, search, segment],
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
        <Text style={styles.emptyTitle}>
          {segment === 'meus' ? 'Você ainda não publicou produtos' : 'Nenhum produto encontrado'}
        </Text>
        <Text style={styles.emptyHint}>
          {segment === 'meus'
            ? 'Toque em "Anunciar produto" para criar seu primeiro anúncio.'
            : 'Tente outro termo de busca ou categoria.'}
        </Text>
      </View>
    );
  }, [loadError, loading, segment]);

  return (
    <View style={styles.container}>
      <FlatList
        data={displayItems}
        key={`${segment}-${category}-${search}`}
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
        onEndReached={() => {
          if (segment === 'todos') void loadMore();
        }}
        onEndReachedThreshold={0.35}
      />

      {!isVisitante ? (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.fab}
          onPress={() => router.push('/marketplace/publicar')}
        >
          <LinearGradient
            colors={['#7c3aed', '#db2777']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.fabText}>Anunciar produto</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
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
  listContent: { paddingBottom: 100, flexGrow: 1 },
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
  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
