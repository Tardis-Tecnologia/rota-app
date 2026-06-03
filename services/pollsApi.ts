import { getApiBaseUrl, getAuthToken } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';
import { redeemReward } from './rewardService';

const BASE_PATH = '/api/v1';

export interface PollDto {
  id: string;
  hostId: string;
  name: string;
  description: string | null;
  options: unknown;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PollVoteResponseDto {
  id: string;
  userId?: string;
  pollId: string;
  votedAt: string;
}

export interface PollRewardLinkDto {
  id: string;
  hostId: string;
  pollId: string;
  rewardId: string;
  createdAt: string;
}

export interface RewardPublicDto {
  id: string;
  name: string;
  description: string | null;
  value: number | null;
  status: 'ativa' | 'inativa';
  host: string;
}

function resolveHostId(explicit?: string): string {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;

  const token = getAuthToken();
  if (token) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      const fromJwt = claims.hostId?.trim();
      if (fromJwt) return fromJwt;
    } catch {
      // token inválido: segue para env
    }
  }

  const fromEnv = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  if (!fromEnv) {
    throw new Error(
      'Não foi possível definir o host da enquete. Faça login com usuário vinculado a um host ou defina EXPO_PUBLIC_HOST_ID.',
    );
  }
  return fromEnv;
}

function normalizeApiArray<T>(parsed: unknown): T[] {
  if (Array.isArray(parsed)) {
    return parsed as T[];
  }
  if (parsed && typeof parsed === 'object') {
    const inner = (parsed as Record<string, unknown>).data;
    if (Array.isArray(inner)) {
      return inner as T[];
    }
  }
  return [];
}

function extractPollRewardId(link: unknown): string | null {
  if (!link || typeof link !== 'object') return null;
  const o = link as Record<string, unknown>;
  const raw = o.rewardId ?? o.reward_id;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function formatHttpErrorMessage(text: string, status: number): string {
  const raw = text.trim();
  if (!raw) {
    return `Erro ao carregar enquete (${status}).`;
  }
  try {
    const body = JSON.parse(raw) as { message?: string | string[] };
    if (Array.isArray(body.message) && body.message.length) {
      return body.message.join(', ');
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message.trim();
    }
  } catch {
    // não é JSON
  }
  if (raw.length > 220) {
    return `${raw.slice(0, 220)}…`;
  }
  return raw;
}

export async function getLatestPollForHost(hostId?: string): Promise<PollDto | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  const hid = resolveHostId(hostId);
  const params = new URLSearchParams({
    hostId: hid,
    init: '0',
    end: '1',
  });
  const url = `${getApiBaseUrl()}${BASE_PATH}/polls?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(formatHttpErrorMessage(text, res.status));
  }
  const rows = (await res.json()) as PollDto[];
  return rows[0] ?? null;
}

export async function createPollVote(
  pollId: string,
  optionIndex: number,
  hostId?: string,
): Promise<PollVoteResponseDto> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  const hid = resolveHostId(hostId);
  const qs = new URLSearchParams({ hostId: hid }).toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/poll-votes?${qs}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pollId, optionIndex }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(formatHttpErrorMessage(text, res.status));
  }
  return res.json() as Promise<PollVoteResponseDto>;
}

export async function listPollVotesForUserPoll(
  pollId: string,
  userId: string,
  hostId?: string,
): Promise<PollVoteResponseDto[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  const hid = resolveHostId(hostId);
  const params = new URLSearchParams({
    hostId: hid,
    pollId,
    userId,
  });
  const url = `${getApiBaseUrl()}${BASE_PATH}/poll-votes?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao listar votos: ${res.status}`);
  }
  const parsed: unknown = await res.json();
  return normalizeApiArray<PollVoteResponseDto>(parsed);
}

export async function listPollRewardsForPoll(
  pollId: string,
  hostId?: string,
): Promise<PollRewardLinkDto[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  const hid = resolveHostId(hostId);
  const params = new URLSearchParams({
    hostId: hid,
    pollId,
    init: '0',
    end: '50',
  });
  const url = `${getApiBaseUrl()}${BASE_PATH}/poll-rewards?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao carregar vínculo enquete/recompensa: ${res.status}`);
  }
  const parsed: unknown = await res.json();
  return normalizeApiArray<PollRewardLinkDto>(parsed);
}

export async function getRewardById(rewardId: string): Promise<RewardPublicDto> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  const url = `${getApiBaseUrl()}${BASE_PATH}/rewards/${encodeURIComponent(rewardId)}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao carregar recompensa: ${res.status}`);
  }
  return res.json() as Promise<RewardPublicDto>;
}

export async function buildVoteRewardToastMessage(
  pollId: string,
  hostId?: string,
  options?: { redeem?: boolean },
): Promise<string> {
  if (options?.redeem === false) {
    return 'Opção atualizada';
  }

  let links: PollRewardLinkDto[];
  try {
    links = await listPollRewardsForPoll(pollId, hostId);
  } catch {
    return 'Voto registrado';
  }

  const rewardIds = [
    ...new Set(
      links
        .map((row) => extractPollRewardId(row))
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (rewardIds.length === 0) {
    return 'Voto registrado';
  }

  let totalPontosGanhos = 0;

  for (const rewardId of rewardIds) {
    try {
      const res = await redeemReward(rewardId);
      const delta = coerceNumber(res.pointsDelta) ?? 0;
      if (delta > 0) {
        totalPontosGanhos += delta;
      }
    } catch {
      // mantém fluxo; toast curto no final
    }
  }

  if (totalPontosGanhos > 0) {
    return `+${totalPontosGanhos.toLocaleString('pt-BR')} pontos ganhos`;
  }
  return 'Voto registrado';
}
