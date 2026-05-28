/** Texto relativo curto em português (ex.: "agora", "há 12 min"). */
export function formatRelativeTimePt(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return 'agora';

  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `há ${min} min`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} dia${days === 1 ? '' : 's'}`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
