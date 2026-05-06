import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';
const DEFAULT_ACTIVE_REWARDS = true;
const REWARDS_HOST_ID = process.env.EXPO_PUBLIC_HOST_ID;

// ===== TYPES =====

export interface UserRewardPoints {
  rewardPoints: number;
  cpf?: string | null;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  value: number;
  active: boolean;
  hostId: string;
}

export interface RedeemRewardResponse {
  rewardPoints?: number;
  pointsDelta?: number;
  couponCode?: string;
  rewardId?: string;
  value?: number;
  id?: string;
}

export interface RewardRedemptionItem {
  id: string;
  rewardId: string;
  userId: string;
  value: number;
  createdAt: string;
  redeemedAt?: string;
  couponCode?: string;
  reward?: RewardItem;
}

// ===== ERROR =====

export class RewardApiError extends Error {
  code:
    | 'NOT_AUTHENTICATED'
    | 'INSUFFICIENT_BALANCE'
    | 'USER_WITHOUT_CPF'
    | 'REWARD_INACTIVE'
    | 'BAD_REQUEST'
    | 'HTTP_ERROR'
    | 'NETWORK_ERROR';
  status?: number;

  constructor(
    message: string,
    code:
      | 'NOT_AUTHENTICATED'
      | 'INSUFFICIENT_BALANCE'
      | 'USER_WITHOUT_CPF'
      | 'REWARD_INACTIVE'
      | 'BAD_REQUEST'
      | 'HTTP_ERROR'
      | 'NETWORK_ERROR',
    status?: number,
  ) {
    super(message);
    this.name = 'RewardApiError';
    this.code = code;
    this.status = status;
  }
}

function parseApiErrorMessage(text: string): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[]; error?: string };
    if (Array.isArray(json.message) && json.message.length > 0) {
      return json.message.join(', ');
    }
    if (typeof json.message === 'string' && json.message.trim()) {
      return json.message;
    }
    if (typeof json.error === 'string' && json.error.trim()) {
      return json.error;
    }
  } catch {
    // ignore parse error
  }
  return text.trim() || 'Erro na requisição';
}

function mapErrorCode(message: string, status: number): RewardApiError['code'] {
  const m = message.toLowerCase();
  if (status === 401) return 'NOT_AUTHENTICATED';
  if (m.includes('saldo insuficiente') || m.includes('insufficient balance')) {
    return 'INSUFFICIENT_BALANCE';
  }
  if (m.includes('cpf') && (m.includes('obrig') || m.includes('required'))) {
    return 'USER_WITHOUT_CPF';
  }
  if (m.includes('inativa') || m.includes('inactive')) {
    return 'REWARD_INACTIVE';
  }
  if (status === 400) return 'BAD_REQUEST';
  return 'HTTP_ERROR';
}

// ===== REQUEST BASE =====

async function requestApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
  } = {},
): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new RewardApiError('Não autenticado', 'NOT_AUTHENTICATED', 401);
  }

  const url = `${getApiBaseUrl()}${BASE_PATH}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body && { 'Content-Type': 'application/json' }),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const message = parseApiErrorMessage(text);
      throw new RewardApiError(message, mapErrorCode(message, response.status), response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof RewardApiError) {
      throw error;
    }
    throw new RewardApiError('Erro de conexão com o servidor', 'NETWORK_ERROR');
  }
}

// ===== HELPERS =====

export function getConfiguredRewardsHostId(): string {
  const hostId = REWARDS_HOST_ID?.trim();
  if (!hostId) {
    throw new RewardApiError(
      'EXPO_PUBLIC_HOST_ID não configurado',
      'BAD_REQUEST',
      400,
    );
  }
  return hostId;
}

// ===== API =====

export async function getUserRewardPoints(): Promise<UserRewardPoints> {
  return requestApi('/users/reward-points');
}

export async function getRewards(options?: {
  init?: number;
  end?: number;
  active?: boolean;
}): Promise<RewardItem[]> {
  const hostId = getConfiguredRewardsHostId();

  const params = new URLSearchParams({ hostId });
  const active =
    typeof options?.active === 'boolean' ? options.active : DEFAULT_ACTIVE_REWARDS;
  params.set('active', String(active));
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));

  const data = await requestApi<RewardItem[]>(`/rewards?${params.toString()}`);
  return Array.isArray(data) ? data : [];
}

export async function redeemReward(rewardId: string): Promise<RedeemRewardResponse> {
  return requestApi('/rewards/redeem', {
    method: 'POST',
    body: { rewardId },
  });
}

export async function getRewardRedemptions(userId: string): Promise<RewardRedemptionItem[]> {
  const params = new URLSearchParams({ userId });

  const data = await requestApi<RewardRedemptionItem[]>(
    `/rewards/redemptions?${params.toString()}`,
  );

  return Array.isArray(data) ? data : [];
}