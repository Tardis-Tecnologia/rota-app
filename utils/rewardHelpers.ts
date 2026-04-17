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

export function filterRewardsByTab(
  rewards: CatalogReward[],
  redeemedIds: Set<string>,
  tab: RewardsFilterTab,
): CatalogReward[] {
  const v = (r: CatalogReward) => r.value ?? 0;
  switch (tab) {
    case 'resgatar':
      return rewards.filter((r) => !redeemedIds.has(r.id) && v(r) < 0);
    case 'ganhar':
      return rewards.filter((r) => !redeemedIds.has(r.id) && v(r) > 0);
    default:
      return [];
  }
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
    case 'resgatar':
      return 'Não há recompensas de resgate disponíveis no momento.';
    case 'ganhar':
      return 'Não há opções disponíveis para ganhar pontos no momento.';
    default:
      return '';
  }
}
