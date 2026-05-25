import type { EventItem } from '@/services/eventsService';
import type { Evento } from '@/types';
import { eventItemToEvento } from '@/utils/eventsCarousel';
import { resolveEventImageUrl } from '@/utils/eventImage';

export type EventListItem = Evento & {
  descricao?: string;
  localNome?: string;
  endereco?: string;
  organizador?: string;
  categorias: string[];
  featured: boolean;
  startDateIso: string | null;
  endDateIso: string | null;
  capacity: number | null;
  status?: string;
};

function formatOrganizerLabel(createdBy: string | null | undefined): string | undefined {
  const raw = createdBy?.trim();
  if (!raw) return undefined;
  const pipe = raw.indexOf('|');
  if (pipe >= 0) {
    const name = raw.slice(pipe + 1).trim();
    return name || raw;
  }
  return raw;
}

export type EventCategoryKey =
  | 'todos'
  | 'cultural'
  | 'festividade'
  | 'show'
  | 'feira'
  | 'esporte'
  | string;

export const EVENT_CATEGORY_FILTERS: Array<{
  key: EventCategoryKey;
  label: string;
  icon:
    | 'grid-outline'
    | 'color-palette-outline'
    | 'gift-outline'
    | 'musical-notes-outline'
    | 'storefront-outline'
    | 'football-outline'
    | 'pricetag-outline';
}> = [
  { key: 'todos', label: 'Todos', icon: 'grid-outline' },
  { key: 'cultural', label: 'Cultural', icon: 'color-palette-outline' },
  { key: 'festividade', label: 'Festividade', icon: 'gift-outline' },
  { key: 'show', label: 'Show', icon: 'musical-notes-outline' },
  { key: 'feira', label: 'Feira', icon: 'storefront-outline' },
];

export function eventItemToListItem(item: EventItem): EventListItem {
  const base = eventItemToEvento(item);
  const imagem = resolveEventImageUrl(item) ?? base.imagem;
  return {
    ...base,
    imagem,
    descricao: item.description?.trim() || undefined,
    localNome: item.locationName?.trim() || undefined,
    endereco: item.locationAddress?.trim() || undefined,
    organizador: formatOrganizerLabel(item.createdBy),
    categorias: Array.isArray(item.categories) ? item.categories : [],
    featured: Boolean(item.featured),
    startDateIso: item.startDate,
    endDateIso: item.endDate,
    capacity: item.capacity,
    status: item.status?.trim() || undefined,
  };
}

export function primaryCategoryKey(item: EventListItem): string {
  const raw = item.categorias[0]?.trim().toLowerCase();
  return raw || 'cultural';
}

export function getCategoryMeta(key: string): {
  label: string;
  color: string;
  bg: string;
} {
  const k = key.toLowerCase();
  switch (k) {
    case 'festividade':
      return { label: 'Festividade', color: '#c2410c', bg: '#ffedd5' };
    case 'show':
      return { label: 'Show', color: '#7c3aed', bg: '#ede9fe' };
    case 'feira':
      return { label: 'Feira', color: '#0f766e', bg: '#ccfbf1' };
    case 'esporte':
      return { label: 'Esporte', color: '#15803d', bg: '#dcfce7' };
    case 'cultural':
    default:
      return { label: 'Cultural', color: '#6d28d9', bg: '#ede9fe' };
  }
}

export function formatListDateParts(iso: string | null): { day: string; month: string; weekday: string } {
  if (!iso) {
    return { day: '--', month: '---', weekday: '---' };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { day: '--', month: '---', weekday: '---' };
  }
  return {
    day: d.toLocaleDateString('pt-BR', { day: '2-digit' }),
    month: d
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .toUpperCase(),
    weekday: d
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toUpperCase(),
  };
}

export function formatFeaturedDateLine(item: EventListItem): string {
  if (!item.startDateIso) return item.data;
  const start = new Date(item.startDateIso);
  if (Number.isNaN(start.getTime())) return item.data;
  if (item.endDateIso) {
    const end = new Date(item.endDateIso);
    if (!Number.isNaN(end.getTime()) && end.getTime() !== start.getTime()) {
      const startPart = start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
      const endPart = end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
      return `${startPart} a ${endPart}`;
    }
  }
  return start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export function formatDetailDate(item: EventListItem): { main: string; sub: string } {
  if (!item.startDateIso) {
    return { main: item.data, sub: '' };
  }
  const start = new Date(item.startDateIso);
  if (Number.isNaN(start.getTime())) {
    return { main: item.data, sub: '' };
  }
  return {
    main: start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
    sub: start.toLocaleDateString('pt-BR', { weekday: 'long' }),
  };
}

export function formatDetailTime(item: EventListItem): { main: string; sub: string } {
  const horario = item.horario?.trim();
  if (!horario) return { main: '—', sub: '' };
  const parts = horario.split(' - ');
  return {
    main: parts[0] ?? horario,
    sub: parts[1] ? parts[1].replace(/^até\s*/i, '') : '',
  };
}

export function formatLocationLine(item: EventListItem): string {
  const nome = item.localNome?.trim();
  const end = item.endereco?.trim();
  if (nome && end) return `${nome} • ${end}`;
  if (nome) return nome;
  if (end) return end;
  return item.local?.trim() || 'Local a definir';
}

export function formatCapacityLabel(capacity: number | null): string | null {
  if (capacity == null || capacity <= 0) return null;
  return capacity.toLocaleString('pt-BR');
}
