import type { EventItem } from '@/services/eventsService';
import type { Evento } from '@/types';
import { resolveEventImageUrl } from '@/utils/eventImage';

export const EVENT_TIME_ZONE = 'America/Sao_Paulo';

function eventDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function startOfLocalDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return eventDateKey(a) === eventDateKey(b);
}

export function formatEventDateLabel(start: Date | null): string {
  if (!start || Number.isNaN(start.getTime())) return 'Data a definir';
  const today = new Date();
  if (isSameDay(start, today)) return 'Hoje';
  const tomorrow = new Date(today);
  tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000);
  if (isSameDay(start, tomorrow)) return 'Amanhã';
  return start.toLocaleDateString('pt-BR', {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function formatTimeRange(start: Date | null, end: Date | null): string {
  if (!start || Number.isNaN(start.getTime())) return '';
  const fmt = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { timeZone: EVENT_TIME_ZONE, hour: '2-digit', minute: '2-digit' });
  if (!end || Number.isNaN(end.getTime())) return fmt(start);
  if (!isSameDay(start, end)) {
    const endLabel = formatEventDateLabel(end);
    return `${fmt(start)} - até ${endLabel}, ${fmt(end)}`;
  }
  return `${fmt(start)} - até ${fmt(end)}`;
}

export function eventItemToEvento(item: EventItem): Evento {
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;
  const imagem = resolveEventImageUrl(item);

  return {
    id: item.id,
    titulo: item.title,
    data: formatEventDateLabel(start),
    horario: formatTimeRange(start, end),
    local:
      item.locationName?.trim() ||
      item.locationAddress?.trim() ||
      'Local a definir',
    imagem,
  };
}

export function formatEventCardDateLine(evento: Evento): string {
  const texto = evento.horario ? `${evento.data}, ${evento.horario}` : evento.data;
  return texto.toUpperCase();
}
