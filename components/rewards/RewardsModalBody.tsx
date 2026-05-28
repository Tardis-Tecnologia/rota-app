import { AppColors } from '@/constants/theme';
import type { CommercialCouponCatalogItem } from '@/services/commercialCouponsApi';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { CatalogReward, RewardsFilterTab, StoreCouponsListEntry } from '../../types/index';
import {
  buildStoreCouponsListEntries,
  emptyFilterMessage,
  listStoreCouponsForDisplay,
} from '../../utils/rewardHelpers';
import CommercialPartnerCouponCard from './CommercialPartnerCouponCard';
import RewardEarnPointsCard from './RewardEarnPointsCard';
import RewardStoreCouponCard from './RewardStoreCouponCard';

interface RewardsModalBodyProps {
  filterTab: RewardsFilterTab;
  currentPoints: number;
  rewardActionError: string | null;
  rewards: CatalogReward[];
  filteredRewards: CatalogReward[];
  commercialCoupons: CommercialCouponCatalogItem[];
  storeCouponHoldIds: Set<string>;
  couponCodeByRewardId: Record<string, string>;
  loadingRedeemId: string | null;
  isLoadingRewards: boolean;
  isLoadingCommercialCoupons: boolean;
  rewardsError: string | null;
  commercialCouponsError: string | null;
  loadingMore: boolean;
  onEndReached: () => void;
  onRedeem: (rewardId: string, cost: number) => void;
  onLockedRewardPress: (reward: CatalogReward) => void;
  onRetryLoadRewards: () => void;
  onRetryLoadCommercialCoupons: () => void;
  onCouponCopied?: () => void;
  citizenUserId?: string;
}

export default function RewardsModalBody({
  filterTab,
  currentPoints,
  rewardActionError,
  rewards,
  filteredRewards,
  commercialCoupons,
  storeCouponHoldIds,
  couponCodeByRewardId,
  loadingRedeemId,
  isLoadingRewards,
  isLoadingCommercialCoupons,
  rewardsError,
  commercialCouponsError,
  loadingMore,
  onEndReached,
  onRedeem,
  onLockedRewardPress,
  onRetryLoadRewards,
  onRetryLoadCommercialCoupons,
  onCouponCopied,
  citizenUserId,
}: RewardsModalBodyProps) {
  const storeCoupons = useMemo(
    () => listStoreCouponsForDisplay(rewards, storeCouponHoldIds),
    [rewards, storeCouponHoldIds],
  );

  const commercialById = useMemo(() => {
    const map = new Map<string, CommercialCouponCatalogItem>();
    for (const c of commercialCoupons) {
      map.set(c.id, c);
    }
    return map;
  }, [commercialCoupons]);

  const rewardById = useMemo(() => {
    const map = new Map<string, CatalogReward>();
    for (const r of storeCoupons) {
      map.set(r.id, r);
    }
    return map;
  }, [storeCoupons]);

  const storeCouponsList = useMemo(
    () => buildStoreCouponsListEntries(commercialCoupons, rewards, storeCouponHoldIds),
    [commercialCoupons, rewards, storeCouponHoldIds],
  );

  const listData: StoreCouponsListEntry[] | CatalogReward[] =
    filterTab === 'cupons_lojas' ? storeCouponsList : filteredRewards;

  const isStoreTab = filterTab === 'cupons_lojas';
  const isLoading = isStoreTab
    ? isLoadingRewards || isLoadingCommercialCoupons
    : isLoadingRewards;
  const loadError = isStoreTab
    ? commercialCouponsError && rewardsError
      ? commercialCouponsError
      : rewardsError
    : rewardsError;

  const listHeader =
    rewardActionError && (filterTab === 'cupons_lojas' || filterTab === 'meus_resgates') ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackError}>{rewardActionError}</Text>
      </View>
    ) : isStoreTab && commercialCouponsError && !isLoadingCommercialCoupons ? (
      <View style={styles.feedbackInline}>
        <Text style={styles.feedbackError}>{commercialCouponsError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void onRetryLoadCommercialCoupons()}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Recarregar cupons de lojas</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const listFooter =
    loadingMore && !isStoreTab ? (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={AppColors.palette.purple.base} />
        <Text style={styles.footerText}>Carregando…</Text>
      </View>
    ) : null;

  const empty =
    isLoading ? (
      <View style={styles.feedback}>
        <ActivityIndicator color={AppColors.palette.purple.base} />
        <Text style={styles.feedbackText}>Carregando recompensas...</Text>
      </View>
    ) : loadError && !isStoreTab ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackError}>{loadError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void onRetryLoadRewards()}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    ) : isStoreTab && listData.length === 0 && !commercialCouponsError ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>{emptyFilterMessage(filterTab)}</Text>
      </View>
    ) : !isStoreTab && rewards.length === 0 ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>Nenhuma recompensa disponível no momento.</Text>
      </View>
    ) : !isStoreTab && listData.length === 0 ? (
      <View style={styles.feedback}>
        <Text style={styles.feedbackText}>{emptyFilterMessage(filterTab)}</Text>
      </View>
    ) : null;

  return (
    <FlatList
      data={listData}
      keyExtractor={(item) =>
        typeof item === 'object' && 'kind' in item ? `${item.kind}-${item.id}` : item.id
      }
      renderItem={({ item }) => {
        if (isStoreTab && 'kind' in item) {
          if (item.kind === 'commercial') {
            const coupon = commercialById.get(item.id);
            if (!coupon) return null;
            return (
              <CommercialPartnerCouponCard
                coupon={coupon}
                citizenUserId={citizenUserId}
                onCopySuccess={onCouponCopied}
              />
            );
          }
          const reward = rewardById.get(item.id);
          if (!reward) return null;
          return (
            <RewardStoreCouponCard
              reward={reward}
              isPurchased={storeCouponHoldIds.has(reward.id)}
              couponCode={couponCodeByRewardId[reward.id]}
              isLoading={loadingRedeemId === reward.id}
              canBuyWithBalance={
                (reward.value ?? 0) >= 0 || Math.abs(reward.value ?? 0) <= currentPoints
              }
              onLockedPress={onLockedRewardPress}
              onRedeem={onRedeem}
              onCopySuccess={onCouponCopied}
            />
          );
        }

        const reward = item as CatalogReward;
        return (
          <RewardEarnPointsCard
            reward={reward}
            isLoading={loadingRedeemId === reward.id}
            onRedeem={onRedeem}
          />
        );
      }}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={empty}
      ListFooterComponent={listFooter}
      onEndReached={isStoreTab ? undefined : onEndReached}
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
  feedbackInline: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 4,
    gap: 8,
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
