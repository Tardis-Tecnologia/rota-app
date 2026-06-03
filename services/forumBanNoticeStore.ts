import { isForumInactiveUserMessage } from '@/utils/forumPostingSuspensionParse';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BAN_NOTICE_KEY = 'rota_forum_ban_notice';

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as { localStorage: Storage }).localStorage;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Texto padrão exibido no login após banimento (active: false). */
export const FORUM_BANNED_ACCOUNT_NOTICE =
  'Sua conta foi banida por infringir as diretrizes de censura ou segurança do sistema.';

/** Conta banida no rota-back — não repassa mensagem genérica do servidor (ex.: contato com prefeitura). */
export function buildForumBannedNoticeMessage(moderatorReason?: string | null): string {
  const reason = moderatorReason?.trim();
  if (reason) {
    return `${FORUM_BANNED_ACCOUNT_NOTICE}\n\nMotivo: ${reason}`;
  }
  return FORUM_BANNED_ACCOUNT_NOTICE;
}

/** Código interno quando auth recusa conta banida/inativa. */
export const FORUM_ACCOUNT_BANNED_ERROR = 'FORUM_ACCOUNT_BANNED';

export function isBannedAccountAuthMessage(message: string): boolean {
  const m = message.trim();
  return m === FORUM_ACCOUNT_BANNED_ERROR || isForumInactiveUserMessage(m);
}

export function resolveCitizenLoginUiFeedback(error: unknown): {
  banNotice: string | null;
  error: string;
} {
  if (error instanceof Error) {
    if (error.message === 'EMAIL_OU_SENHA_INCORRETOS') {
      return { banNotice: null, error: 'E-mail ou senha incorretos.' };
    }
    if (isBannedAccountAuthMessage(error.message)) {
      return { banNotice: FORUM_BANNED_ACCOUNT_NOTICE, error: '' };
    }
    return { banNotice: null, error: error.message };
  }
  return { banNotice: null, error: 'Não foi possível entrar. Tente novamente.' };
}

/** @deprecated use buildForumBannedNoticeMessage */
export const buildForumInactiveNoticeMessage = buildForumBannedNoticeMessage;

export async function saveForumBanNotice(message: string): Promise<void> {
  const text = message.trim();
  if (!text) return;
  const ls = webStorage();
  if (ls) {
    ls.setItem(BAN_NOTICE_KEY, text);
    return;
  }
  await SecureStore.setItemAsync(BAN_NOTICE_KEY, text);
}

export async function consumeForumBanNotice(): Promise<string | null> {
  const ls = webStorage();
  const raw = ls
    ? ls.getItem(BAN_NOTICE_KEY)
    : await SecureStore.getItemAsync(BAN_NOTICE_KEY);
  if (!raw?.trim()) return null;
  if (ls) {
    ls.removeItem(BAN_NOTICE_KEY);
  } else {
    await SecureStore.deleteItemAsync(BAN_NOTICE_KEY);
  }
  return raw.trim();
}
