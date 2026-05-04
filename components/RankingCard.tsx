import { AppColors } from '@/constants/theme';
import type { WeeklyMissionsRankingLeaderboardEntry } from '@/services/citizenMissionsApi';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function RankingCard({
  weekLabel,
  rankPosition,
  entries,
}: {
  weekLabel: string;
  rankPosition: number | null;
  entries: WeeklyMissionsRankingLeaderboardEntry[];
}) {
  return (
    <View style={styles.rankingWrap}>
      <View style={styles.rankingHeaderRow}>
        <Text style={styles.rankingTitle}>RANKING DO BAIRRO</Text>
        <View style={styles.rankPill}>
          <Ionicons name="trophy-outline" size={16} color={AppColors.palette.amber.base} />
          <Text style={styles.rankPillText}>{rankPosition ? `#${rankPosition}` : 'Sem posição'}</Text>
        </View>
      </View>

      <View style={styles.rankingCard}>
        <View style={styles.rankingTopRow}>
          <View style={styles.rankingWeekRow}>
            <Ionicons
              name="people-outline"
              size={18}
              color={AppColors.text.tertiary}
              style={styles.rankingWeekIcon}
            />
            <Text style={styles.rankingWeekText} numberOfLines={2}>
              {weekLabel}
            </Text>
          </View>
        </View>

        <View style={styles.rankingDivider} />

        {entries.map((entry, index) => {
          const position = entry.position ?? index + 1;
          const medalBg =
            position === 1
              ? AppColors.palette.amber.light
              : position === 2
                ? '#EEF2FF'
                : position === 3
                  ? '#FEE2E2'
                  : AppColors.background.muted;
          return (
            <View key={`${entry.userId}-${entry.position}`} style={styles.rankingRow}>
              <View style={[styles.positionBadge, { backgroundColor: medalBg }]}>
                <Text style={styles.positionBadgeText}>{position}</Text>
              </View>
              <Text style={styles.rankingName} numberOfLines={1}>
                {entry.name}
              </Text>
              <View style={styles.rankingPointsRow}>
                <Ionicons name="star" size={16} color={AppColors.text.yellow} />
                <Text style={styles.rankingPointsText}>{entry.weeklyPoints}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  rankingWeekRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  rankingWeekIcon: {
    marginTop: 2,
  },
  rankingWeekText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '900',
    color: AppColors.text.secondary,
    lineHeight: 20,
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

