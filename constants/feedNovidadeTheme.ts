import type { FeedNovidadeCategoria, FeedNovidadeTipo } from '@/types/feedNovidade';
import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export const FEED_CATEGORIA_THEME: Record<
  FeedNovidadeCategoria,
  { label: string; color: string; bg: string; icon: IconName }
> = {
  noticias: { label: 'Notícia', color: '#1d4ed8', bg: '#dbeafe', icon: 'newspaper-outline' },
  obras: { label: 'Obras', color: '#b45309', bg: '#ffedd5', icon: 'construct-outline' },
  lazer: { label: 'Lazer', color: '#047857', bg: '#d1fae5', icon: 'leaf-outline' },
  enquetes: { label: 'Enquete', color: '#1d4ed8', bg: '#e8f2fc', icon: 'stats-chart-outline' },
};

export const FEED_TIPO_THEME: Record<
  FeedNovidadeTipo,
  { color: string; bg: string; icon: IconName }
> = {
  comunicado: { color: '#1d4ed8', bg: '#dbeafe', icon: 'megaphone-outline' },
  alerta: { color: '#b91c1c', bg: '#fee2e2', icon: 'warning-outline' },
  atualizacao: { color: '#0f766e', bg: '#ccfbf1', icon: 'refresh-outline' },
  evento: { color: '#7c3aed', bg: '#ede9fe', icon: 'calendar-outline' },
  aviso: { color: '#c2410c', bg: '#ffedd5', icon: 'information-circle-outline' },
};
