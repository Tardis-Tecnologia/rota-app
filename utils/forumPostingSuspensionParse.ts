/** Mensagem exata do rota-back: assertCanPublish (403). */
const SUSPEND_MESSAGE_PREFIX = 'você está suspenso de publicar no fórum até ';

export type ParsedPostingSuspension = {
  suspendedUntil: string;
  suspendedUntilDate: Date;
};

export function parsePostingSuspensionMessage(message: string): ParsedPostingSuspension | null {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  if (!lower.includes(SUSPEND_MESSAGE_PREFIX)) return null;

  const idx = lower.indexOf(SUSPEND_MESSAGE_PREFIX);
  const isoPart = trimmed.slice(idx + SUSPEND_MESSAGE_PREFIX.length).trim();
  const until = new Date(isoPart);
  if (Number.isNaN(until.getTime())) return null;

  return {
    suspendedUntil: until.toISOString(),
    suspendedUntilDate: until,
  };
}

export function isPostingSuspensionActive(suspendedUntilIso: string | null | undefined): boolean {
  if (!suspendedUntilIso?.trim()) return false;
  const until = new Date(suspendedUntilIso);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() > Date.now();
}

export function formatPostingSuspensionUntil(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isForumInactiveUserMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('usuário inativo') ||
    m.includes('usuario inativo') ||
    m.includes('não encontrado ou inativo') ||
    m.includes('nao encontrado ou inativo')
  );
}
