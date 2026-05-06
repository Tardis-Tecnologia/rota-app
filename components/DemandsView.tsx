import { AppColors } from '@/constants/theme';
import { getAuthToken, getWhitelabelHostId } from '@/services/authApi';
import { parseJwtAccessTokenPayload } from '@/services/jwtAccessTokenClaims';
import { getDemands, getDemandsStats, type DemandResponseDto, type DemandsStatsResponseDto } from '@/services/demandsApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PAGE_SIZE = 10;
const DEMANDS_FETCH_SIZE = 500;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveHostId(): string {
  const token = getAuthToken();
  if (token) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      const fromToken = (claims.hostId ?? '')?.toString().trim();
      if (fromToken && UUID_REGEX.test(fromToken)) return fromToken;
    } catch {
    }
  }
  return getWhitelabelHostId();
}

function formatDatePtBr(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export function DemandsView() {
  const hostId = useMemo(() => resolveHostId(), []);

  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<string[]>([]);

  const [allDemands, setAllDemands] = useState<DemandResponseDto[]>([]);
  const [stats, setStats] = useState<DemandsStatsResponseDto>({ highlights: 0, lastMonth: 0, publishedPercent: 0 });

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const n = selectedNeighborhood.trim();
    if (!n) return allDemands;
    return allDemands.filter((d) => (d.neighborhood ?? '').trim() === n);
  }, [allDemands, selectedNeighborhood]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const loadAll = useCallback(async () => {
    setError(null);
    const [demandsRaw, statsRaw] = await Promise.all([
      getDemands({ hostId, init: 0, end: DEMANDS_FETCH_SIZE }),
      getDemandsStats({ hostId }).catch(() => ({ highlights: 0, lastMonth: 0, publishedPercent: 0 })),
    ]);
    setAllDemands(demandsRaw);
    setStats(statsRaw);
    const uniq = Array.from(
      new Set(
        demandsRaw
          .map((d) => (d.neighborhood ?? '').trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    setNeighborhoodOptions(uniq);
  }, [hostId]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      try {
        await loadAll();
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar demandas');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [loadAll]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedNeighborhood]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar demandas');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAll]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
  }, [filtered.length, hasMore]);

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={AppColors.accent} />
        <Text style={styles.loadingText}>Carregando demandas…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <Pressable style={styles.errorCard} onPress={onRefresh}>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Toque para tentar novamente.</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={visibleItems}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.35}
        onEndReached={loadMore}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={styles.heroOverline}>PAINEL DE ENTREGAS</Text>
              <Text style={styles.heroTitle}>Demandas concluídas</Text>
              <Text style={styles.heroSubtitle}>Publicações oficiais com melhorias já executadas pela Prefeitura.</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, styles.statBoxAccent]}>
                <Text style={styles.statValueAccent}>{String(stats.highlights)}</Text>
                <Text style={styles.statLabel}>destaques</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>+{String(stats.lastMonth)}</Text>
                <Text style={styles.statLabel}>este mês</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{String(stats.publishedPercent)}%</Text>
                <Text style={styles.statLabel}>publicadas</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>BAIRRO</Text>
            <FlatList
              data={['', ...neighborhoodOptions]}
              keyExtractor={(v) => v || '__all__'}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              renderItem={({ item }) => {
                const label = item ? item : 'Todos';
                const active = item === selectedNeighborhood;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedNeighborhood(item)}
                    activeOpacity={0.85}
                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={22} color={AppColors.gray[500]} />
            <Text style={styles.emptyTitle}>Nenhuma demanda encontrada</Text>
            <Text style={styles.emptyText}>Tente mudar o bairro ou atualizar a lista.</Text>
          </View>
        }
        ListFooterComponent={hasMore ? <View style={styles.footerSpace} /> : <View style={styles.footerSpace} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.bullet} />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {(item.neighborhood || '—') + (item.date ? ` • ${formatDatePtBr(item.date)}` : '')}
                </Text>
              </View>
              {item.highlight ? (
                <View style={styles.pillSuccess}>
                  <Text style={styles.pillSuccessText}>Destaque</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.bodyBox}>
              <Text style={styles.bodyLine}>
                <Text style={styles.bodyKey}>Órgão responsável: </Text>
                <Text style={styles.bodyVal}>{item.responsibleAgency || '-'}</Text>
              </Text>
              <Text style={styles.bodyLine}>
                <Text style={styles.bodyKey}>Resumo: </Text>
                <Text style={styles.bodyVal}>{item.summary || item.description || '-'}</Text>
              </Text>
              <Text style={styles.bodyLine}>
                <Text style={styles.bodyKey}>Impacto para a população: </Text>
                <Text style={styles.bodyVal}>{item.impact || '-'}</Text>
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  loadingWrap: {
    flex: 1,
    backgroundColor: AppColors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: AppColors.gray[500], fontSize: 13, fontWeight: '600' },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: AppColors.background.backgroundDanger,
    borderWidth: 1,
    borderColor: AppColors.background.borderDanger,
  },
  errorTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B', marginBottom: 4 },
  errorText: { fontSize: 13, color: '#7F1D1D' },
  errorHint: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#991B1B' },

  hero: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#0F172A',
    marginTop: 6,
    marginBottom: 12,
  },
  heroOverline: { color: '#67E8F9', fontWeight: '900', fontSize: 12, letterSpacing: 1.2 },
  heroTitle: { color: '#fff', marginTop: 8, fontSize: 20, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.78)', marginTop: 6, fontSize: 13, lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: AppColors.background.muted,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statBoxAccent: { backgroundColor: '#ECFEFF', borderColor: '#A5F3FC' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  statValueAccent: { fontSize: 22, fontWeight: '900', color: '#0891b2' },
  statLabel: { marginTop: 2, fontSize: 12, color: AppColors.gray[500], fontWeight: '700' },

  sectionLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: '#334155', marginBottom: 8 },
  chipsRow: { paddingBottom: 12, gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  chipActive: { backgroundColor: '#0891b2', borderColor: '#0891b2' },
  chipInactive: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  chipText: { fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  chipTextInactive: { color: '#334155' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0891b2', marginTop: 6 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  cardMeta: { marginTop: 4, fontSize: 12, fontWeight: '700', color: '#64748B' },
  pillSuccess: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillSuccessText: { color: '#047857', fontWeight: '900', fontSize: 12 },
  bodyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bodyLine: { fontSize: 13, lineHeight: 18, color: '#0F172A', marginBottom: 8 },
  bodyKey: { fontWeight: '900', color: '#0F172A' },
  bodyVal: { fontWeight: '600', color: '#334155' },
  empty: { paddingVertical: 22, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  emptyText: { fontSize: 13, color: AppColors.gray[500], textAlign: 'center' },
  footerSpace: { height: 16 },
});

