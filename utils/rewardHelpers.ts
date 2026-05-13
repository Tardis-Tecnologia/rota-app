import type { RewardItem as ApiRewardItem, RewardRedemptionItem } from '@/services/rewardService';

import type { CatalogReward, RewardsFilterTab } from '../types/index';

export function mapRewardFromApi(item: ApiRewardItem): CatalogReward {
  return {
    id: item.id,
    name: item.name,
    description: item.description?.trim() || '',
    value: item.value,
  };
}

export function getRequiredBalanceForRedeem(value: number): number {
  return value < 0 ? Math.abs(value) : 0;
}

export function formatHistoryDeltaLabel(delta: number): string {
  const abs = Math.abs(delta).toLocaleString('pt-BR');
  if (delta > 0) return `+${abs}`;
  if (delta < 0) return `-${abs}`;
  return '0';
}

export function storeCouponActiveHoldIds(
  redemptions: RewardRedemptionItem[],
  catalog: CatalogReward[],
): Set<string> {
  const out = new Set<string>();
  for (const item of redemptions) {
    const cat = catalog.find((r) => r.id === item.rewardId);
    if (!cat || (cat.value ?? 0) >= 0) continue;
    if (item.couponUsed === true) continue;
    out.add(item.rewardId);
  }
  return out;
}

export function filterRewardsByTab(
  rewards: CatalogReward[],
  redeemedIds: Set<string>,
  tab: RewardsFilterTab,
  storeHoldIds?: Set<string>,
): CatalogReward[] {
  const v = (r: CatalogReward) => r.value ?? 0;
  switch (tab) {
    case 'cupons_lojas': {
      const hold = storeHoldIds ?? redeemedIds;
      return rewards.filter((r) => !hold.has(r.id) && v(r) < 0);
    }
    case 'meus_resgates':
      return rewards.filter((r) => !redeemedIds.has(r.id) && v(r) > 0);
    default:
      return [];
  }
}

/** Cupons de loja (custo em pontos): comprados primeiro, depois por menor custo. */
export function listStoreCouponsForDisplay(
  rewards: CatalogReward[],
  storeHoldIds: Set<string>,
): CatalogReward[] {
  const store = rewards.filter((r) => (r.value ?? 0) < 0);
  return [...store].sort((a, b) => {
    const aRed = storeHoldIds.has(a.id) ? 0 : 1;
    const bRed = storeHoldIds.has(b.id) ? 0 : 1;
    if (aRed !== bRed) return aRed - bRed;
    return Math.abs(a.value ?? 0) - Math.abs(b.value ?? 0);
  });
}

export function resolveRedemptionDelta(
  item: RewardRedemptionItem,
  catalog: CatalogReward[],
): number | null {
  const fromList = catalog.find((r) => r.id === item.rewardId);
  const raw =
    typeof item.value === 'number'
      ? item.value
      : typeof item.reward?.value === 'number'
        ? item.reward.value
        : typeof fromList?.value === 'number'
          ? fromList.value
          : null;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

export function emptyFilterMessage(tab: RewardsFilterTab): string {
  switch (tab) {
    case 'cupons_lojas':
      return 'Não há cupons de lojas disponíveis no momento.';
    case 'meus_resgates':
      return 'Não há resgates de pontos disponíveis no momento.';
    default:
      return '';
  }
}

function redemptionSortTime(item: RewardRedemptionItem): number {
  const raw = item.redeemedAt ?? item.createdAt;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function latestCouponCodeForReward(
  rewardId: string,
  redemptions: RewardRedemptionItem[],
): string | undefined {
  const sorted = [...redemptions].sort(
    (a, b) => redemptionSortTime(b) - redemptionSortTime(a),
  );
  const found = sorted.find(
    (r) => r.rewardId === rewardId && r.couponUsed !== true,
  );
  return found?.couponCode?.trim() || undefined;
}
