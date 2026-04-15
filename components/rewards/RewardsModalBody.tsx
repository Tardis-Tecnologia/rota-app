import { AppColors } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RewardRedemptionItem } from '@/services/rewardService';
import type { CatalogReward, RewardsFilterTab } from '../../types/index';
import { emptyFilterMessage } from '../../utils/rewardHelpers';
import RewardCatalogCard from './RewardCatalogCard';
import RewardRedemptionHistory from './RewardRedemptionHistory';

interface RewardsModalBodyProps {
  filterTab: RewardsFilterTab;
  rewardActionError: string | null;
  redemptions: RewardRedemptionItem[];
  rewards: CatalogReward[];
  filteredRewards: CatalogReward[];
  redeemedIds: Set<string>;
  loadingRedeemId: string | null;
  isLoadingRewards: boolean;
  rewardsError: string | null;
  onRedeem: (rewardId: string, cost: number) => void;
  onRetryLoadRewards: () => void;
}

export default function RewardsModalBody({
  filterTab,
  rewardActionError,
  redemptions,
  rewards,
  filteredRewards,
  redeemedIds,
  loadingRedeemId,
  isLoadingRewards,
  rewardsError,
  onRedeem,
  onRetryLoadRewards,
}: RewardsModalBodyProps) {
  if (filterTab === 'historico') {
    return (
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <RewardRedemptionHistory redemptions={redemptions} catalog={rewards} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator
      nestedScrollEnabled
    >
      {rewardActionError ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackError}>{rewardActionError}</Text>
        </View>
      ) : null}

      {filteredRewards.map((reward) => (
        <RewardCatalogCard
          key={reward.id}
          reward={reward}
          isRedeemed={redeemedIds.has(reward.id)}
          isLoading={loadingRedeemId === reward.id}
          onRedeem={onRedeem}
        />
      ))}

      {isLoadingRewards ? (
        <View style={styles.feedback}>
          <ActivityIndicator color={AppColors.palette.purple.base} />
          <Text style={styles.feedbackText}>Carregando recompensas...</Text>
        </View>
      ) : null}

      {!isLoadingRewards && rewardsError ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackError}>{rewardsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              void onRetryLoadRewards();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoadingRewards && !rewardsError && rewards.length === 0 ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>Nenhuma recompensa disponível no momento.</Text>
        </View>
      ) : null}

      {!isLoadingRewards &&
      !rewardsError &&
      rewards.length > 0 &&
      filteredRewards.length === 0 ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{emptyFilterMessage(filterTab)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  feedback: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  feedbackText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
  feedbackError: {
    fontSize: 14,
    color: AppColors.status.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: AppColors.palette.purple.base,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.white,
  },
});
