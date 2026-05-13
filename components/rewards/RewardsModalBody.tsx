import { AppColors } from '@/constants/theme';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import type { CatalogReward, RewardsFilterTab } from '../../types/index';
import { emptyFilterMessage, listStoreCouponsForDisplay } from '../../utils/rewardHelpers';
import RewardEarnPointsCard from './RewardEarnPointsCard';
import RewardStoreCouponCard from './RewardStoreCouponCard';

interface RewardsModalBodyProps {
  filterTab: RewardsFilterTab;
  currentPoints: number;
  rewardActionError: string | null;
  rewards: CatalogReward[];
  filteredRewards: CatalogReward[];
  storeCouponHoldIds: Set<string>;
  couponCodeByRewardId: Record<string, string>;
  loadingRedeemId: string | null;
  isLoadingRewards: boolean;
  rewardsError: string | null;
  loadingMore: boolean;
  onEndReached: () => void;
  onRedeem: (rewardId: string, cost: number) => void;
  onLockedRewardPress: (reward: CatalogReward) => void;
  onRetryLoadRewards: () => void;
  onCouponCopied?: () => void;
}

export default function RewardsModalBody({
  filterTab,
  currentPoints,
  rewardActionError,
  rewards,
  filteredRewards,
  storeCouponHoldIds,
  couponCodeByRewardId,
  loadingRedeemId,
  isLoadingRewards,
  rewardsError,
  loadingMore,
  onEndReached,
  onRedeem,
  onLockedRewardPress,
  onRetryLoadRewards,
  onCouponCopied,
}: RewardsModalBodyProps) {
  const storeCoupons = useMemo(
    () => listStoreCouponsForDisplay(rewards, storeCouponHoldIds),
    [rewards, storeCouponHoldIds],
  );

  const listData =
    filterTab === 'cupons_lojas' ? storeCoupons : filteredRewards;

  const listHeader =
    rewardActionError && (filterTab === 'cupons_lojas' || filterTab === 'meus_resgates') ? (
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
    ) : rewards.length === 0 ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>Nenhuma recompensa disponível no momento.</Text>
      </View>
    ) : listData.length === 0 ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>{emptyFilterMessage(filterTab)}</Text>
      </View>
    ) : null;

  return (
    <FlatList
      data={listData}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) =>
        filterTab === 'cupons_lojas' ? (
          <RewardStoreCouponCard
            reward={item}
            isPurchased={storeCouponHoldIds.has(item.id)}
            couponCode={couponCodeByRewardId[item.id]}
            isLoading={loadingRedeemId === item.id}
            canBuyWithBalance={
              (item.value ?? 0) >= 0 || Math.abs(item.value ?? 0) <= currentPoints
            }
            onLockedPress={onLockedRewardPress}
            onRedeem={onRedeem}
            onCopySuccess={onCouponCopied}
          />
        ) : (
          <RewardEarnPointsCard
            reward={item}
            isLoading={loadingRedeemId === item.id}
            onRedeem={onRedeem}
          />
        )
      }
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
