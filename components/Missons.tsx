import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MissionCategory, RankingEntry } from '@/data/mockMissions';
import { MissionCard } from '@/components/MissionCard';
import { missionCategories, mockMissions, mockRankingEntries } from '@/data/mockMissions';

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${label}`}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function RankingCard({
  weekLabel,
  rankPosition,
  entries,
}: {
  weekLabel: string;
  rankPosition: number;
  entries: RankingEntry[];
}) {
  return (
    <View style={styles.rankingWrap}>
      <View style={styles.rankingHeaderRow}>
        <Text style={styles.rankingTitle}>RANKING DO BAIRRO</Text>
        <View style={styles.rankPill}>
          <Ionicons name="trophy-outline" size={16} color={AppColors.palette.amber.base} />
          <Text style={styles.rankPillText}>{`#${rankPosition}`}</Text>
        </View>
      </View>

      <View style={styles.rankingCard}>
        <View style={styles.rankingTopRow}>
          <View style={styles.rankingWeekRow}>
            <Ionicons name="people-outline" size={18} color={AppColors.text.tertiary} />
            <Text style={styles.rankingWeekText}>{weekLabel}</Text>
          </View>
          <Text style={styles.rankingPointsHeader}>Pontos por missões</Text>
        </View>

        <View style={styles.rankingDivider} />

        {entries.map((entry, index) => {
          const position = index + 1;
          const medalBg =
            position === 1
              ? AppColors.palette.amber.light
              : position === 2
                ? '#EEF2FF'
                : position === 3
                  ? '#FEE2E2'
                  : AppColors.background.muted;
          return (
            <View key={entry.id} style={styles.rankingRow}>
              <View style={[styles.positionBadge, { backgroundColor: medalBg }]}>
                <Text style={styles.positionBadgeText}>{position}</Text>
              </View>
              <Text style={styles.rankingName} numberOfLines={1}>
                {entry.name}
              </Text>
              <View style={styles.rankingPointsRow}>
                <Ionicons name="star" size={16} color={AppColors.text.yellow} />
                <Text style={styles.rankingPointsText}>{entry.points}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function Missons() {
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = useState<MissionCategory>('Todas');

    const handleBack = useCallback(() => {
        router.replace('/(tabs)/home');
      }, []);

    const categories = missionCategories;
    const missions = mockMissions;
    const activeCount = useMemo(() => missions.filter((m) => m.status === 'active').length, [missions]);

    const filteredMissions = useMemo(() => {
      if (selectedCategory === 'Todas') return missions;
      return missions.filter((m) => m.category === selectedCategory);
    }, [missions, selectedCategory]);
    const rankingEntries = mockRankingEntries;

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
          <Text style={styles.title}>Missões Cidadãs</Text>
        </View>

        <View style={styles.headerRight}>
          <Ionicons name="flame-outline" size={18} color={AppColors.report.orange} />
          <Text style={styles.headerRightText}>{`${activeCount} ativas`}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filteredMissions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </View>

        <RankingCard weekLabel="Semana 2026-W18" rankPosition={2} entries={rankingEntries} />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  headerRightText: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.report.orange,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.text.tertiary,
  },
  chipLabelActive: {
    color: AppColors.text.white,
  },
  list: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 10,
  },
  rankingWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  rankingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rankingTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: AppColors.text.tertiary,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  rankPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    overflow: 'hidden',
  },
  rankingTopRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rankingWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankingWeekText: {
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingPointsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.text.tertiary,
  },
  rankingDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  rankingRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankingPointsText: {
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
});