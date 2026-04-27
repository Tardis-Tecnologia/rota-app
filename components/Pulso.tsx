import { AppColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryRatingCard } from './pulso/CategoryRatingCard';
import { NeighborhoodPickerCard } from './pulso/NeighborhoodPickerCard';
import { ProblemsCard } from './pulso/ProblemsCard';
import { SectionTitle } from './pulso/SectionTitle';
import { TrendsCard } from './pulso/TrendsCard';
import {
  NEIGHBORHOODS,
  PULSE_CATEGORIES,
  PULSE_INDEX_BY_NEIGHBORHOOD,
  PULSE_PROBLEMS,
  PULSE_TRENDS,
  type PulseCategoryKey,
} from '@/data/mockPulso';

export function Pulso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [neighborhoodId, setNeighborhoodId] = useState<string>(NEIGHBORHOODS[0]?.id ?? 'centro');
  const [query, setQuery] = useState('');
  const [ratings, setRatings] = useState<Record<PulseCategoryKey, 1 | 2 | 3 | 4 | 5 | undefined>>({
    seguranca: undefined,
    limpeza: undefined,
    transito: undefined,
    iluminacao: undefined,
    areas_verdes: undefined,
  });

  const handleBack = useCallback(() => {
    router.replace('/(tabs)/home');
  }, [router]);

  const neighborhoodName = useMemo(() => {
    return NEIGHBORHOODS.find((n) => n.id === neighborhoodId)?.name ?? 'Centro';
  }, [neighborhoodId]);

  const satisfaction = useMemo(() => {
    const v = PULSE_INDEX_BY_NEIGHBORHOOD[neighborhoodId] ?? 0.6;
    const pct = Math.round(v * 100);
    return Math.max(0, Math.min(100, pct));
  }, [neighborhoodId]);

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
        <LinearGradient
          colors={['#7C3AED', '#0EA5E9', '#06B6D4']}
          start={{ x: 0.05, y: 0.05 }}
          end={{ x: 1, y: 1 }}
          style={styles.indexCard}
        >
          <Text style={styles.indexTitle}>{`ÍNDICE GERAL EM ${neighborhoodName.toUpperCase()}`}</Text>
          <View style={styles.indexKpiRow}>
            <Text style={styles.indexKpiValue}>{satisfaction}%</Text>
            <Text style={styles.indexKpiLabel}>de satisfação</Text>
          </View>
          <Text style={styles.indexDescription}>
            Dados colaborativos da comunidade em tempo contínuo.
          </Text>
        </LinearGradient>

        <NeighborhoodPickerCard
          title="BUSCAR BAIRRO (MARICÁ - RJ)"
          query={query}
          onChangeQuery={setQuery}
          neighborhoods={NEIGHBORHOODS}
          selectedId={neighborhoodId}
          onSelect={(id) => {
            setNeighborhoodId(id);
            setQuery('');
          }}
        />

        <SectionTitle title="AVALIE AS CATEGORIAS" />
        <View>
          {PULSE_CATEGORIES.map((c) => (
            <CategoryRatingCard
              key={c.key}
              category={c}
              selected={ratings[c.key]}
              onSelect={(value) => setRatings((prev) => ({ ...prev, [c.key]: value }))}
            />
          ))}
        </View>

        <TrendsCard trends={PULSE_TRENDS} />
        <View style={{ height: 14 }} />
        <ProblemsCard problems={PULSE_PROBLEMS} />

        <View style={{ height: 24 }} />
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
});