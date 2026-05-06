import { AppColors } from '@/constants/theme';
import { parseJwtAccessTokenPayload } from '@/services/jwtAccessTokenClaims';
import { getAuthToken, getWhitelabelHostId } from '@/services/authApi';
import { getWorks, getWorksStats, type WorkResponseDto, type WorksStatsResponseDto } from '@/services/worksApi';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
const NEIGHBORHOODS_FETCH_SIZE = 500;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatDatePtBr(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

function resolveHostIdForWorks(): string {
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

function WorkStatusPill({ status }: { status: string }) {
  const label = useMemo(() => {
    const v = (status ?? '').toString().trim().toUpperCase();
    if (!v) return 'Em execução';
    if (v === 'FASE_FINAL') return 'Fase final';
    if (v === 'EM_EXECUCAO' || v === 'EM EXECUÇÃO' || v === 'EM_EXECUÇÃO') return 'Em execução';
    return v.replace(/_/g, ' ').toLowerCase();
  }, [status]);

  const tone = useMemo(() => {
    const v = (status ?? '').toString().trim().toUpperCase();
    if (v === 'FASE_FINAL') return { bg: '#FEF3C7', fg: '#B45309', border: '#FDE68A' };
    return { bg: '#FFEDD5', fg: '#C2410C', border: '#FED7AA' };
  }, [status]);

  return (
    <View style={[styles.statusPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.statusPillText, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{String(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function WorksInProgressView(props: { showBack?: boolean; title?: string }) {
  const hostId = useMemo(() => resolveHostIdForWorks(), []);

  const [neighborhoodOptions, setNeighborhoodOptions] = useState<string[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');

  const [stats, setStats] = useState<WorksStatsResponseDto>({ total: 0, faseFinal: 0, last7Days: 0 });
  const [items, setItems] = useState<WorkResponseDto[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const neighborhoodParam = selectedNeighborhood.trim() ? selectedNeighborhood.trim() : undefined;

  const loadNeighborhoodOptions = useCallback(async () => {
    const worksForOptions = await getWorks({ hostId, init: 0, end: NEIGHBORHOODS_FETCH_SIZE });
    const uniq = Array.from(
      new Set(
        worksForOptions
          .map((w) => (w.neighborhood ?? '').trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    setNeighborhoodOptions(uniq);
  }, [hostId]);

  const loadStats = useCallback(async () => {
    try {
      setStatsError(null);
      const statsRaw = await getWorksStats({ hostId, neighborhood: neighborhoodParam });
      setStats(statsRaw);
    } catch {
      setStats({ total: 0, faseFinal: 0, last7Days: 0 });
      setStatsError('Não foi possível carregar os contadores.');
    }
  }, [hostId, neighborhoodParam]);

  const loadFirstPage = useCallback(async () => {
    setError(null);
    setHasMore(true);
    const data = await getWorks({ hostId, neighborhood: neighborhoodParam, init: 0, end: PAGE_SIZE });
    setItems(data);
    setHasMore(data.length >= PAGE_SIZE);
  }, [hostId, neighborhoodParam]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextInit = items.length;
      const data = await getWorks({
        hostId,
        neighborhood: neighborhoodParam,
        init: nextInit,
        end: nextInit + PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, hostId, isLoadingMore, items.length, neighborhoodParam]);

  const reloadAll = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);
    try {
      await Promise.all([loadNeighborhoodOptions(), loadStats(), loadFirstPage()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar obras');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadFirstPage, loadNeighborhoodOptions, loadStats]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([loadNeighborhoodOptions(), loadStats(), loadFirstPage()]);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar obras');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [loadFirstPage, loadNeighborhoodOptions, loadStats]);

  const listHeader = useMemo(() => {
    return (
      <View>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="business-outline" size={22} color="#334155" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Obras em andamento</Text>
            <Text style={styles.heroSubtitle}>Acompanhamento por bairro, status e órgão responsável.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={stats.total} label="Ativas" />
          <StatBox value={stats.faseFinal} label="Fase final" />
          <StatBox value={stats.last7Days} label="Novas semana" />
        </View>
        {statsError ? <Text style={styles.statsErrorText}>{statsError}</Text> : null}

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
    );
  }, [neighborhoodOptions, selectedNeighborhood, stats.faseFinal, stats.last7Days, stats.total, statsError]);

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={AppColors.accent} />
        <Text style={styles.loadingText}>Carregando obras…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {props.showBack ? (
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back-outline" size={22} color={AppColors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{props.title ?? 'Serviços'}</Text>
          <View style={styles.headerBtn} />
        </View>
      ) : null}

      {error ? (
        <Pressable style={styles.errorCard} onPress={reloadAll}>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Toque para tentar novamente.</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={reloadAll} />}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={22} color={AppColors.gray[500]} />
            <Text style={styles.emptyTitle}>Nenhuma obra encontrada</Text>
            <Text style={styles.emptyText}>Tente mudar o bairro ou atualizar a lista.</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={AppColors.accent} />
              <Text style={styles.footerLoadingText}>Carregando mais…</Text>
            </View>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => router.push({ pathname: '/works/[id]', params: { id: item.id } })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <WorkStatusPill status={item.status} />
            </View>

            {item.address ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={AppColors.gray[500]} />
                <Text style={styles.metaText}>{item.address}</Text>
              </View>
            ) : null}

            {item.expectedEndDate ? (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={AppColors.gray[500]} />
                <Text style={styles.metaText}>Conclusão prevista: {formatDatePtBr(item.expectedEndDate)}</Text>
              </View>
            ) : null}

            {item.responsibleAgency ? (
              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={16} color={AppColors.gray[500]} />
                <Text style={styles.metaText}>{item.responsibleAgency}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <Text style={styles.detailLine}>
              <Text style={styles.detailKey}>Empresa: </Text>
              <Text style={styles.detailVal}>{item.company || '-'}</Text>
            </Text>
            <Text style={styles.detailLine}>
              <Text style={styles.detailKey}>Fiscalização: </Text>
              <Text style={styles.detailVal}>{item.inspection || '-'}</Text>
            </Text>
            <Text style={styles.detailLine}>
              <Text style={styles.detailKey}>Impacto no trânsito: </Text>
              <Text style={styles.detailVal}>{item.trafficImpact || '-'}</Text>
            </Text>

            <View style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Ver localização exata</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.gray[500],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statsErrorText: {
    marginTop: -6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  statBox: {
    flex: 1,
    backgroundColor: AppColors.background.muted,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: AppColors.gray[500],
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#334155',
    marginBottom: 8,
  },
  chipsRow: {
    paddingBottom: 12,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  chipInactive: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fff',
  },
  chipTextInactive: {
    color: '#334155',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    flex: 1,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F7',
    marginVertical: 10,
  },
  detailLine: {
    marginBottom: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
  },
  detailKey: {
    fontWeight: '800',
    color: '#0F172A',
  },
  detailVal: {
    fontWeight: '600',
    color: '#334155',
  },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  empty: {
    paddingVertical: 22,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.gray[500],
    textAlign: 'center',
  },
  footerLoading: {
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  footerLoadingText: {
    color: AppColors.gray[500],
    fontSize: 12,
    fontWeight: '600',
  },
  footerSpace: {
    height: 16,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: AppColors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: AppColors.gray[500],
    fontSize: 13,
    fontWeight: '600',
  },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: AppColors.background.backgroundDanger,
    borderWidth: 1,
    borderColor: AppColors.background.borderDanger,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#7F1D1D',
  },
  errorHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
});

