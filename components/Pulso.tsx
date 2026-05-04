import { AppColors } from '@/constants/theme';
import type {
  PulseCategory,
  PulseCategoryKey,
  PulseProblem,
  PulseTrend,
} from '@/data/mockPulso';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryRatingCard } from './pulso/CategoryRatingCard';
import { NeighborhoodPickerCard } from './pulso/NeighborhoodPickerCard';
import { ProblemsCard } from './pulso/ProblemsCard';
import { SectionTitle } from './pulso/SectionTitle';
import { TrendsCard } from './pulso/TrendsCard';
import { getAuthToken } from '@/services/authApi';
import { parseJwtAccessTokenPayload } from '@/services/jwtAccessTokenClaims';
import {
  getAreaCategorySummary,
  getTopReportedProblems,
  getUserAreaRatingStatus,
  getWeeklyPulseTrends,
  listHostAreas,
  submitAreaCategoryRating,
  type ApiTrendCategory,
  type AreaCategoryRatingSummaryDto,
  type AreaCategoryRatingUserStatusDto,
  type HostAreaDto,
  type TopReportedProblemsResponseDto,
  type WeeklyPulseTrendsResponseDto,
} from '@/services/pulseApi';

const API_TO_UI_KEY: Record<ApiTrendCategory, PulseCategoryKey> = {
  security: 'seguranca',
  cleanliness: 'limpeza',
  traffic: 'transito',
  lighting: 'iluminacao',
  green_areas: 'areas_verdes',
};

const API_CATEGORY_LABEL: Record<ApiTrendCategory, string> = {
  security: 'Segurança',
  cleanliness: 'Limpeza',
  traffic: 'Trânsito',
  lighting: 'Iluminação',
  green_areas: 'Áreas Verdes',
};

const CATEGORY_ORDER: ApiTrendCategory[] = [
  'security',
  'cleanliness',
  'traffic',
  'lighting',
  'green_areas',
];

function summaryToCategories(summary: AreaCategoryRatingSummaryDto | null): PulseCategory[] {
  if (!summary) {
    return CATEGORY_ORDER.map((c) => ({
      key: API_TO_UI_KEY[c],
      label: API_CATEGORY_LABEL[c],
      note: 0,
    }));
  }
  const mapNote = (v: number | null): number => (v === null || Number.isNaN(v) ? 0 : v);
  return [
    { key: 'seguranca', label: 'Segurança', note: mapNote(summary.avgSecurity) },
    { key: 'limpeza', label: 'Limpeza', note: mapNote(summary.avgCleanliness) },
    { key: 'transito', label: 'Trânsito', note: mapNote(summary.avgTraffic) },
    { key: 'iluminacao', label: 'Iluminação', note: mapNote(summary.avgLighting) },
    { key: 'areas_verdes', label: 'Áreas Verdes', note: mapNote(summary.avgGreenAreas) },
  ];
}

function trendsToUi(weekly: WeeklyPulseTrendsResponseDto | null): PulseTrend[] {
  return CATEGORY_ORDER.map((cat) => {
    const row = weekly?.trends.find((t) => t.category === cat);
    return {
      key: API_TO_UI_KEY[cat],
      label: API_CATEGORY_LABEL[cat],
      delta: row?.deltaVsPreviousWeek ?? null,
    };
  });
}

function problemsToUi(top: TopReportedProblemsResponseDto | null): PulseProblem[] {
  return (top?.items ?? []).map((i) => ({
    id: i.problemKey,
    label: i.labelPtBr,
    reports: i.reportCount,
  }));
}

function satisfactionPercent(summary: AreaCategoryRatingSummaryDto | null): number {
  if (!summary) return 0;
  const vals = [
    summary.avgSecurity,
    summary.avgCleanliness,
    summary.avgTraffic,
    summary.avgLighting,
    summary.avgGreenAreas,
  ].filter((v): v is number => v !== null && !Number.isNaN(v));
  if (!vals.length) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.max(0, Math.min(100, Math.round((avg / 5) * 100)));
}

function hostLabelUpper(): string {
  const token = getAuthToken();
  if (!token) return 'CIDADE';
  try {
    const c = parseJwtAccessTokenPayload(token);
    const h = typeof c.host === 'string' ? c.host.trim() : '';
    return (h || 'CIDADE').toUpperCase();
  } catch {
    return 'CIDADE';
  }
}

export function Pulso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [areas, setAreas] = useState<HostAreaDto[]>([]);
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [query, setQuery] = useState('');

  const [loadAreas, setLoadAreas] = useState(true);
  const [loadPulse, setLoadPulse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<AreaCategoryRatingSummaryDto | null>(null);
  const [weekly, setWeekly] = useState<WeeklyPulseTrendsResponseDto | null>(null);
  const [topProblems, setTopProblems] = useState<TopReportedProblemsResponseDto | null>(null);
  const [voteStatus, setVoteStatus] = useState<AreaCategoryRatingUserStatusDto | null>(null);

  const [ratings, setRatings] = useState<Record<PulseCategoryKey, 1 | 2 | 3 | 4 | 5 | undefined>>({
    seguranca: undefined,
    limpeza: undefined,
    transito: undefined,
    iluminacao: undefined,
    areas_verdes: undefined,
  });

  const neighborhoods = useMemo(
    () => areas.map((a) => ({ id: a.id, name: a.name })),
    [areas],
  );

  const pickerTitle = useMemo(() => `BUSCAR REGIÃO (${hostLabelUpper()})`, []);

  const categories = useMemo(() => summaryToCategories(summary), [summary]);
  const trends = useMemo(() => trendsToUi(weekly), [weekly]);
  const problems = useMemo(() => problemsToUi(topProblems), [topProblems]);
  const satisfaction = useMemo(() => satisfactionPercent(summary), [summary]);

  const neighborhoodName = useMemo(() => {
    return areas.find((n) => n.id === neighborhoodId)?.name ?? 'Região';
  }, [areas, neighborhoodId]);

  const canSubmit = useMemo(() => {
    const allRated =
      !!neighborhoodId &&
      ratings.seguranca !== undefined &&
      ratings.limpeza !== undefined &&
      ratings.transito !== undefined &&
      ratings.iluminacao !== undefined &&
      ratings.areas_verdes !== undefined;
    const cooldownOk = voteStatus === null || voteStatus.canVoteNow;
    return allRated && cooldownOk;
  }, [neighborhoodId, ratings, voteStatus]);

  const handleBack = useCallback(() => {
    router.replace('/(tabs)/home');
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadAreas(true);
      setError(null);
      try {
        const list = await listHostAreas();
        if (cancelled) return;
        setAreas(list);
        if (list[0]?.id) {
          setNeighborhoodId(list[0].id);
        } else {
          setNeighborhoodId('');
          setError('Nenhuma região cadastrada para o seu host.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar regiões.');
        }
      } finally {
        if (!cancelled) setLoadAreas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!neighborhoodId) return;
    let cancelled = false;
    (async () => {
      setLoadPulse(true);
      setError(null);
      try {
        const [sum, wk, tp, vs] = await Promise.all([
          getAreaCategorySummary(neighborhoodId),
          getWeeklyPulseTrends(neighborhoodId),
          getTopReportedProblems(neighborhoodId, 5),
          getUserAreaRatingStatus(neighborhoodId),
        ]);
        if (cancelled) return;
        setSummary(sum);
        setWeekly(wk);
        setTopProblems(tp);
        setVoteStatus(vs);
      } catch (e) {
        if (!cancelled) {
          setSummary(null);
          setWeekly(null);
          setTopProblems(null);
          setVoteStatus(null);
          setError(e instanceof Error ? e.message : 'Erro ao carregar dados do pulso.');
        }
      } finally {
        if (!cancelled) setLoadPulse(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [neighborhoodId]);

  const onSubmit = useCallback(async () => {
    if (!neighborhoodId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitAreaCategoryRating(neighborhoodId, {
        security: ratings.seguranca!,
        cleanliness: ratings.limpeza!,
        traffic: ratings.transito!,
        lighting: ratings.iluminacao!,
        greenAreas: ratings.areas_verdes!,
      });
      Alert.alert('Enviado', 'Sua avaliação foi registrada.');
      setRatings({
        seguranca: undefined,
        limpeza: undefined,
        transito: undefined,
        iluminacao: undefined,
        areas_verdes: undefined,
      });
      const [sum, wk, tp, vs] = await Promise.all([
        getAreaCategorySummary(neighborhoodId),
        getWeeklyPulseTrends(neighborhoodId),
        getTopReportedProblems(neighborhoodId, 5),
        getUserAreaRatingStatus(neighborhoodId),
      ]);
      setSummary(sum);
      setWeekly(wk);
      setTopProblems(tp);
      setVoteStatus(vs);
    } catch (e) {
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível enviar a avaliação.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, neighborhoodId, ratings]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a Home"
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={AppColors.text.secondary} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Pulso do Bairro</Text>
          <Text style={styles.subtitle}>Avalie como está sua região agora</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadAreas ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={AppColors.accent} />
            <Text style={styles.centerText}>Carregando regiões...</Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <LinearGradient
              colors={['#7C3AED', '#0EA5E9', '#06B6D4']}
              start={{ x: 0.05, y: 0.05 }}
              end={{ x: 1, y: 1 }}
              style={styles.indexCard}
            >
              <Text style={styles.indexTitle}>{`ÍNDICE GERAL EM ${neighborhoodName.toUpperCase()}`}</Text>
              <View style={styles.indexKpiRow}>
                <Text style={styles.indexKpiValue}>{loadPulse ? '…' : `${satisfaction}`}%</Text>
                <Text style={styles.indexKpiLabel}>de satisfação</Text>
              </View>
              <Text style={styles.indexDescription}>
                {summary
                  ? `${summary.totalSubmissions} avaliações colaborativas no total.`
                  : 'Dados colaborativos da comunidade em tempo contínuo.'}
              </Text>
            </LinearGradient>

            {neighborhoodId ? (
              <NeighborhoodPickerCard
                title={pickerTitle}
                query={query}
                onChangeQuery={setQuery}
                neighborhoods={neighborhoods}
                selectedId={neighborhoodId}
                onSelect={(id) => {
                  setNeighborhoodId(id);
                  setQuery('');
                }}
              />
            ) : null}

            {loadPulse ? (
              <View style={styles.inlineLoad}>
                <ActivityIndicator color={AppColors.accent} />
                <Text style={styles.inlineLoadText}>Atualizando indicadores...</Text>
              </View>
            ) : null}

            <SectionTitle title="AVALIE AS CATEGORIAS" />
            <View>
              {categories.map((c) => (
                <CategoryRatingCard
                  key={c.key}
                  category={c}
                  selected={ratings[c.key]}
                  onSelect={(value) => setRatings((prev) => ({ ...prev, [c.key]: value }))}
                />
              ))}
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit || submitting || !neighborhoodId}
              style={({ pressed }) => [
                styles.submitBtn,
                (!canSubmit || submitting || !neighborhoodId) && styles.submitBtnDisabled,
                pressed && styles.submitBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enviar avaliação"
            >
              {submitting ? (
                <ActivityIndicator color={AppColors.text.white} />
              ) : (
                <Text style={styles.submitBtnText}>Enviar avaliação</Text>
              )}
            </Pressable>

            {voteStatus && !voteStatus.canVoteNow && voteStatus.nextVoteAllowedAt ? (
              <View style={styles.cooldownHint}>
                <Text style={styles.cooldownHintText}>
                  Intervalo mínimo de 7 dias entre avaliações nesta região. Próximo envio:{' '}
                  {new Date(voteStatus.nextVoteAllowedAt).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                  .
                </Text>
              </View>
            ) : null}

            <TrendsCard trends={trends} />
            <View style={{ height: 14 }} />
            <ProblemsCard problems={problems} />

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: AppColors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.text.tertiary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  centerBlock: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  errorText: {
    color: AppColors.status.error,
    fontWeight: '700',
    fontSize: 14,
  },
  cooldownHint: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  cooldownHintText: {
    color: AppColors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  indexCard: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  indexTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: 'rgba(255,255,255,0.92)',
    textTransform: 'uppercase',
  },
  indexKpiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    gap: 10,
  },
  indexKpiValue: {
    fontSize: 44,
    fontWeight: '900',
    color: AppColors.text.white,
    lineHeight: 46,
  },
  indexKpiLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  indexDescription: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  inlineLoad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  inlineLoadText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  submitBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnPressed: {
    opacity: 0.9,
  },
  submitBtnText: {
    color: AppColors.text.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
