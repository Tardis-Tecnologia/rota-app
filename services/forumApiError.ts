import {
  isForumInactiveUserMessage,
  parsePostingSuspensionMessage,
} from '@/utils/forumPostingSuspensionParse';

export type ForumApiErrorCode =
  | 'FORUM_POSTING_SUSPENDED'
  | 'FORUM_USER_INACTIVE'
  | 'HTTP_ERROR';

export class ForumApiError extends Error {
  readonly code: ForumApiErrorCode;
  readonly httpStatus: number;
  /** ISO8601 — rota-back embute na mensagem de suspensão. */
  readonly suspendedUntil: string | null;

  constructor(
    message: string,
    code: ForumApiErrorCode,
    httpStatus: number,
    suspendedUntil?: string | null,
  ) {
    super(message);
    this.name = 'ForumApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.suspendedUntil = suspendedUntil?.trim() || null;
  }
}

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

function pickMessage(body: Record<string, unknown>, fallback: string): string {
  const raw = body.message;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw)) {
    const joined = raw
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
      .join(' ');
    if (joined) return joined;
  }
  return fallback;
}

function detectForumErrorCode(
  message: string,
  httpStatus: number,
): ForumApiErrorCode {
  const parsedSuspend = parsePostingSuspensionMessage(message);
  if (parsedSuspend) {
    return 'FORUM_POSTING_SUSPENDED';
  }

  if (
    (httpStatus === 401 || httpStatus === 403) &&
    isForumInactiveUserMessage(message)
  ) {
    return 'FORUM_USER_INACTIVE';
  }

  return 'HTTP_ERROR';
}

export async function parseForumApiError(res: Response): Promise<ForumApiError> {
  const fallback = res.statusText || `HTTP ${res.status}`;
  let message = fallback;

  try {
    const raw = await res.text();
    if (!raw) {
      return new ForumApiError(message, 'HTTP_ERROR', res.status);
    }
    try {
      const body = JSON.parse(raw) as Record<string, unknown>;
      message = pickMessage(body, fallback);
    } catch {
      message = raw.slice(0, 220);
    }
  } catch {
    // ignore
  }

  const code = detectForumErrorCode(message, res.status);
  const parsedSuspend = parsePostingSuspensionMessage(message);

  if (code === 'FORUM_POSTING_SUSPENDED' && parsedSuspend) {
    return new ForumApiError(
      message,
      code,
      res.status,
      parsedSuspend.suspendedUntil,
    );
  }

  if (code === 'FORUM_USER_INACTIVE') {
    return new ForumApiError(message, code, res.status);
  }

  return new ForumApiError(message, 'HTTP_ERROR', res.status);
}

export async function assertForumResponseOk(res: Response): Promise<void> {
  if (res.ok) return;
  throw await parseForumApiError(res);
}

export function isForumInactiveUserError(error: unknown): boolean {
  return error instanceof ForumApiError && error.code === 'FORUM_USER_INACTIVE';
}

/** @deprecated use isForumInactiveUserError */
export function isForumBanError(error: unknown): boolean {
  return isForumInactiveUserError(error);
}

export function isForumPostingSuspendedError(error: unknown): error is ForumApiError {
  return error instanceof ForumApiError && error.code === 'FORUM_POSTING_SUSPENDED';
}
