import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

export type ForumReportTargetType = 'FORUM_POST' | 'FORUM_COMMENT' | 'FORUM_COMMUNITY';

export type ForumReportReason =
  | 'SPAM'
  | 'HATE'
  | 'HARASSMENT'
  | 'MISINFORMATION'
  | 'VIOLENCE'
  | 'OTHER';

export type ForumReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface CreateForumReportBody {
  targetType: ForumReportTargetType;
  targetId: string;
  reason: ForumReportReason;
  details?: string;
  hostId?: string;
}

export interface ForumReportTargetPreview {
  title?: string | null;
  content?: string | null;
}

export interface ForumReportResponseDto {
  id: string;
  hostId: string;
  reporterUserId: string;
  reportedUserId: string;
  targetType: ForumReportTargetType;
  targetId: string;
  reason: ForumReportReason;
  details: string | null;
  status: ForumReportStatus;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  targetPreview?: ForumReportTargetPreview | null;
  reporterName?: string | null;
  reportedUserName?: string | null;
}

export type ForumReportErrorCode =
  | 'ALREADY_REPORTED'
  | 'OWN_CONTENT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'FAILED';

export class ForumReportError extends Error {
  readonly code: ForumReportErrorCode;

  constructor(message: string, code: ForumReportErrorCode) {
    super(message);
    this.name = 'ForumReportError';
    this.code = code;
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

function mapReportError(res: Response, message: string): ForumReportError {
  if (res.status === 409) {
    return new ForumReportError(message, 'ALREADY_REPORTED');
  }
  if (res.status === 401) {
    return new ForumReportError(message, 'UNAUTHORIZED');
  }
  if (res.status === 403) {
    return new ForumReportError(message, 'FORBIDDEN');
  }
  if (res.status === 404) {
    return new ForumReportError(message, 'NOT_FOUND');
  }
  if (res.status === 400) {
    const lower = message.toLowerCase();
    if (lower.includes('próprio') || lower.includes('proprio')) {
      return new ForumReportError(message, 'OWN_CONTENT');
    }
    return new ForumReportError(message, 'FAILED');
  }
  return new ForumReportError(message, 'FAILED');
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function createForumReport(
  body: CreateForumReportBody,
): Promise<ForumReportResponseDto> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/forum/reports`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      targetType: body.targetType,
      targetId: body.targetId.trim(),
      reason: body.reason,
      ...(body.details?.trim() ? { details: body.details.trim() } : {}),
      ...(body.hostId?.trim() ? { hostId: body.hostId.trim() } : {}),
    }),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw mapReportError(res, message);
  }

  return (await res.json()) as ForumReportResponseDto;
}
