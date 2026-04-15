import { AppColors } from '@/constants/theme';
import type { RewardRedemptionItem } from '@/services/rewardService';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CatalogReward } from '../../types/index';
import { formatHistoryDeltaLabel, resolveRedemptionDelta } from '../../utils/rewardHelpers';

interface RewardRedemptionHistoryProps {
  redemptions: RewardRedemptionItem[];
  catalog: CatalogReward[];
}

export default function RewardRedemptionHistory({
  redemptions,
  catalog,
}: RewardRedemptionHistoryProps) {
  if (redemptions.length === 0) {
    return (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>Nenhum resgate no histórico ainda.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Histórico de resgates</Text>
      {redemptions.map((item, index, arr) => {
        const rewardFromList = catalog.find((r) => r.id === item.rewardId);
        const rewardName =
          item.reward?.name ?? rewardFromList?.name ?? 'Recompensa';
        const delta = resolveRedemptionDelta(item, catalog);

        const badge =
          delta === null ? (
            <View style={[styles.badge, styles.badgeNeutral]}>
              <Text style={styles.badgeTextNeutral}>—</Text>
            </View>
          ) : delta > 0 ? (
            <View style={[styles.badge, styles.badgeCredit]}>
              <Text style={styles.badgeTextCredit}>{formatHistoryDeltaLabel(delta)}</Text>
            </View>
          ) : delta < 0 ? (
            <View style={[styles.badge, styles.badgeDebit]}>
              <Text style={styles.badgeTextDebit}>{formatHistoryDeltaLabel(delta)}</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeNeutral]}>
              <Text style={styles.badgeTextNeutral}>0</Text>
            </View>
          );

        return (
          <View
            key={item.id}
            style={[styles.row, index < arr.length - 1 ? styles.rowBorder : null]}
          >
            <Text style={styles.name} numberOfLines={2}>
              {rewardName}
            </Text>
            {badge}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border.muted,
  },
  name: {
    flex: 1,
    fontSize: 12,
    color: AppColors.text.secondary,
    paddingRight: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    flexShrink: 0,
  },
  badgeCredit: {
    backgroundColor: 'rgba(39, 174, 96, 0.16)',
  },
  badgeTextCredit: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.status.success,
  },
  badgeDebit: {
    backgroundColor: 'rgba(231, 76, 60, 0.14)',
  },
  badgeTextDebit: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.status.error,
  },
  badgeNeutral: {
    backgroundColor: AppColors.gray[200],
  },
  badgeTextNeutral: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text.tertiary,
  },
  feedback: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  feedbackText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
});
