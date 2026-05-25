import {
  getApiBaseUrl,
  getAuthToken,
  getWhitelabelHostId,
} from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';
import { StreamChat } from 'stream-chat';

const BASE_PATH = '/api/v1/stream-chat';

export interface StreamConversationSummary {
  cid: string;
  channelType: string;
  channelId: string;
  name: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  peerUserId: string | null;
  peerName: string | null;
  peerImage: string | null;
  disabled: boolean;
  customData: Record<string, unknown> | null;
}

export interface StreamConversationsPage {
  conversations: StreamConversationSummary[];
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CreateStreamChannelBody {
  hostId: string;
  channelType?: string;
  channelId?: string;
  memberIds: string[];
  name?: string;
  image?: string;
}

export interface ParsedStreamCid {
  cid: string;
  channelType: string;
  channelId: string;
}

/** hostId do JWT, com fallback em EXPO_PUBLIC_HOST_ID. */
export function resolveStreamHostId(): string {
  const token = getAuthToken();
  if (token) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      const fromJwt = claims.hostId?.trim();
      if (fromJwt) return fromJwt;
    } catch {
      // ignore
    }
  }
  return getWhitelabelHostId();
}

export function streamChatUrl(path: string, hostId?: string): string {
  const hid = hostId ?? resolveStreamHostId();
  const trimmed = path.replace(/^\//, '');
  const join = trimmed.includes('?') ? '&' : '?';
  return `${getApiBaseUrl()}${BASE_PATH}/${trimmed}${join}hostId=${encodeURIComponent(hid)}`;
}

let connectedApiKey: string | null = null;
let connectedUserId: string | null = null;
let connectInFlight: Promise<StreamChat> | null = null;
let connectInFlightUserId: string | null = null;

/** Desconecta o usuário Stream (troca de conta / logout). */
export async function disconnectStreamChat(): Promise<void> {
  connectInFlight = null;
  connectInFlightUserId = null;

  const apiKey = connectedApiKey;
  connectedApiKey = null;
  const prevUserId = connectedUserId;
  connectedUserId = null;

  if (!apiKey) return;
  try {
    const client = StreamChat.getInstance(apiKey);
    if (client.userID || prevUserId) {
      await client.disconnectUser();
    }
  } catch {
    // ignore — cliente pode já estar desconectado
  }
}

/**
 * Garante Stream conectado ao usuário logado.
 * Se outro usuário estava conectado no singleton, faz disconnect antes.
 */
export async function ensureStreamChatConnected(
  userId: string,
  displayName: string,
): Promise<StreamChat> {
  const uid = userId.trim();
  if (!uid) throw new Error('Usuário de chat inválido.');

  if (connectInFlight && connectInFlightUserId === uid) {
    return connectInFlight;
  }

  const run = async (): Promise<StreamChat> => {
    const authToken = getAuthToken();
    if (!authToken) throw new Error('Faça login para usar o chat.');

    const tokenRes = await fetch(streamChatUrl('token'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    });
    if (!tokenRes.ok) {
      throw new Error(await readErrorMessage(tokenRes));
    }

    const { token, apiKey } = (await tokenRes.json()) as { token: string; apiKey: string };
    const client = StreamChat.getInstance(apiKey);

    if (client.userID && client.userID !== uid) {
      await client.disconnectUser();
      connectedUserId = null;
    }

    if (client.userID !== uid) {
      await client.connectUser({ id: uid, name: displayName.trim() || 'Usuário' }, token);
    }

    connectedApiKey = apiKey;
    connectedUserId = uid;
    return client;
  };

  connectInFlightUserId = uid;
  connectInFlight = run().finally(() => {
    connectInFlight = null;
    connectInFlightUserId = null;
  });

  return connectInFlight;
}

export function parseStreamCid(cid: string): ParsedStreamCid {
  const colon = cid.indexOf(':');
  if (colon <= 0 || colon >= cid.length - 1) {
    throw new Error('Resposta de chat inválida (cid).');
  }
  return {
    cid,
    channelType: cid.slice(0, colon),
    channelId: cid.slice(colon + 1),
  };
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

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string | string[] };
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
      if (Array.isArray(j?.message)) return j.message.join(', ');
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function createStreamChannel(
  body: Omit<CreateStreamChannelBody, 'hostId'> & { hostId?: string },
): Promise<ParsedStreamCid> {
  const hostId = body.hostId ?? resolveStreamHostId();
  const url = `${getApiBaseUrl()}${BASE_PATH}/channels`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      hostId,
      channelType: body.channelType ?? 'messaging',
      ...(body.channelId ? { channelId: body.channelId } : {}),
      memberIds: body.memberIds,
      ...(body.name?.trim() ? { name: body.name.trim() } : {}),
      ...(body.image?.trim() ? { image: body.image.trim() } : {}),
    }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as { cid?: string };
  if (!data.cid?.trim()) throw new Error('Canal de chat criado sem identificador.');
  return parseStreamCid(data.cid.trim());
}

export async function listStreamConversations(options?: {
  hostId?: string;
  limit?: number;
  offset?: number;
  hasUnread?: boolean;
}): Promise<StreamConversationsPage> {
  const hostId = options?.hostId ?? resolveStreamHostId();
  const params = new URLSearchParams({
    hostId,
    limit: String(options?.limit ?? 20),
    offset: String(options?.offset ?? 0),
  });
  if (options?.hasUnread) params.set('has_unread', 'true');
  const url = `${getApiBaseUrl()}${BASE_PATH}/conversations?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as StreamConversationsPage;
}

export async function markStreamChannelRead(
  channelType: string,
  channelId: string,
  hostId?: string,
): Promise<void> {
  const hid = hostId ?? resolveStreamHostId();
  const url = `${getApiBaseUrl()}${BASE_PATH}/${encodeURIComponent(channelType)}/${encodeURIComponent(channelId)}/read?hostId=${encodeURIComponent(hid)}`;
  const res = await fetch(url, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}
