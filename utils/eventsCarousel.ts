import { getApiBaseUrl } from '@/services/authApi';
import type { EventItem } from '@/services/eventsService';
import type { Evento } from '@/types';

export function startOfLocalDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatEventDateLabel(start: Date | null): string {
  if (!start || Number.isNaN(start.getTime())) return 'Data a definir';
  const today = startOfLocalDay();
  if (isSameDay(start, today)) return 'Hoje';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(start, tomorrow)) return 'Amanhã';
  return start.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function formatTimeRange(start: Date | null, end: Date | null): string {
  if (!start || Number.isNaN(start.getTime())) return '';
  const fmt = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
  const imagem =
    item.image?.publicUrl ??
    (item.image?.id
      ? `${getApiBaseUrl()}/api/v1/upload/files/${item.image.id}`
      : undefined);

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
