import type { MarketplaceCategoryId, MarketplaceListFilter } from '@/types/marketplace';
import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export const MARKETPLACE_CATEGORY_META: Record<
  MarketplaceCategoryId,
  { label: string; icon: IconName; color: string; bg: string }
> = {
  eletronicos: { label: 'Eletrônicos', icon: 'phone-portrait-outline', color: '#6d28d9', bg: '#ede9fe' },
  moveis: { label: 'Móveis', icon: 'bed-outline', color: '#b45309', bg: '#ffedd5' },
  veiculos: { label: 'Veículos', icon: 'car-outline', color: '#0369a1', bg: '#e0f2fe' },
  moda: { label: 'Moda', icon: 'pricetag-outline', color: '#be185d', bg: '#fce7f3' },
  casa: { label: 'Casa', icon: 'home-outline', color: '#047857', bg: '#d1fae5' },
  esportes: { label: 'Esportes', icon: 'bicycle-outline', color: '#0f766e', bg: '#ccfbf1' },
  outros: { label: 'Outros', icon: 'grid-outline', color: '#475569', bg: '#f1f5f9' },
};

export function getMarketplaceCategoryMeta(category: string) {
  const key = category as MarketplaceCategoryId;
  if (key in MARKETPLACE_CATEGORY_META) {
    return MARKETPLACE_CATEGORY_META[key];
  }
  return {
    ...MARKETPLACE_CATEGORY_META.outros,
    label: category.trim() || MARKETPLACE_CATEGORY_META.outros.label,
  };
}

export const MARKETPLACE_FILTER_OPTIONS: { key: MarketplaceListFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  ...(
    Object.entries(MARKETPLACE_CATEGORY_META) as [
      MarketplaceCategoryId,
      (typeof MARKETPLACE_CATEGORY_META)[MarketplaceCategoryId],
    ][]
  ).map(([key, meta]) => ({ key, label: meta.label })),
];
