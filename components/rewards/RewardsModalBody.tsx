import { AppColors } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { RewardRedemptionItem } from '@/services/rewardService';
import type { CatalogReward, RewardsFilterTab } from '../../types/index';
import { emptyFilterMessage } from '../../utils/rewardHelpers';
import RewardCatalogCard from './RewardCatalogCard';
import RewardRedemptionHistory from './RewardRedemptionHistory';

interface RewardsModalBodyProps {
  filterTab: RewardsFilterTab;
  currentPoints: number;
  rewardActionError: string | null;
  redemptions: RewardRedemptionItem[];
  rewards: CatalogReward[];
  filteredRewards: CatalogReward[];
  redeemedIds: Set<string>;
  loadingRedeemId: string | null;
  isLoadingRewards: boolean;
  rewardsError: string | null;
  loadingMore: boolean;
  onEndReached: () => void;
  onRedeem: (rewardId: string, cost: number) => void;
  onLockedRewardPress: (reward: CatalogReward) => void;
  onRetryLoadRewards: () => void;
}

export default function RewardsModalBody({
  filterTab,
  currentPoints,
  rewardActionError,
  redemptions,
  rewards,
  filteredRewards,
  redeemedIds,
  loadingRedeemId,
  isLoadingRewards,
  rewardsError,
  loadingMore,
  onEndReached,
  onRedeem,
  onLockedRewardPress,
  onRetryLoadRewards,
}: RewardsModalBodyProps) {
  const listHeader =
    filterTab !== 'historico' && rewardActionError ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackError}>{rewardActionError}</Text>
      </View>
    ) : null;

  const listFooter =
    loadingMore ? (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={AppColors.palette.purple.base} />
        <Text style={styles.footerText}>Carregando…</Text>
      </View>
    ) : null;

  const empty =
    isLoadingRewards ? (
      <View style={styles.feedback}>
        <ActivityIndicator color={AppColors.palette.purple.base} />
        <Text style={styles.feedbackText}>Carregando recompensas...</Text>
      </View>
    ) : rewardsError ? (
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
    ) : filterTab === 'historico' ? (
      <RewardRedemptionHistory redemptions={redemptions} catalog={rewards} />
    ) : rewards.length === 0 ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>Nenhuma recompensa disponível no momento.</Text>
      </View>
    ) : filteredRewards.length === 0 ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>{emptyFilterMessage(filterTab)}</Text>
      </View>
    ) : null;

  if (filterTab === 'historico') {
    return (
      <View style={styles.list}>
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={empty ?? <RewardRedemptionHistory redemptions={redemptions} catalog={rewards} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator
        />
      </View>
    );
  }

  return (
    <FlatList
      data={filteredRewards}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => (
        <RewardCatalogCard
          reward={item}
          isRedeemed={redeemedIds.has(item.id)}
          isLoading={loadingRedeemId === item.id}
          canRedeemWithBalance={(item.value ?? 0) >= 0 || Math.abs(item.value ?? 0) <= currentPoints}
          onLockedPress={onLockedRewardPress}
          onRedeem={onRedeem}
        />
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={empty}
      ListFooterComponent={listFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.35}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      showsVerticalScrollIndicator
    />
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
  footerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
});
