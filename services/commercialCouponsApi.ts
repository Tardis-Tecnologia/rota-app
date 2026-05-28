import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';
const ROTA_COUPON_REGEX = /ROTA-CUP1-[A-Z0-9]{6}/i;
const MANUAL_CODE_REGEX = /^[A-Z0-9_-]{3,32}$/;

export interface CommercialCoupon {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
  validUntil?: string;
  active: boolean;
  usageCount: number;
}

export type MarkCouponUsedResult = {
  status: 'marked' | 'already_used';
  code: string;
  usageCount: number;
};

export type CheckCouponUsageResult = {
  used: boolean;
  code: string;
  userId: string;
  usedAt?: string;
  usageCount: number;
};

export interface CreateCommercialCouponPayload {
  name: string;
  discountPercent: number;
  code?: string;
  validUntil?: string;
}

export interface UpdateCommercialCouponPayload {
  name?: string;
  discountPercent?: number;
  validUntil?: string | null;
}

export type CommercialCouponStats = {
  activeCount: number;
  totalUsage: number;
  topCoupon?: { name: string; code: string; usageCount: number };
};

function parseApiErrorMessage(text: string): string {
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(j.message)) return j.message.join(', ');
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* ignore */
  }
  return text.trim() || 'Erro inesperado';
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Normaliza código manual (BANHO20) ou ROTA-CUP1-XXXXXX. */
export function normalizeCommercialCouponCode(raw: string): string {
  const trimmed = raw.trim();
  const rotaMatch = trimmed.match(ROTA_COUPON_REGEX);
  const code = (rotaMatch ? rotaMatch[0] : trimmed).toUpperCase();
  if (!MANUAL_CODE_REGEX.test(code)) {
    throw new Error(
      'Código inválido. Use 3 a 32 caracteres (letras, números, hífen ou underscore).',
    );
  }
  return code;
}

/** @deprecated Use normalizeCommercialCouponCode */
export const normalizeCouponCode = normalizeCommercialCouponCode;

export function summarizeCommercialCoupons(
  coupons: CommercialCoupon[],
): CommercialCouponStats {
  const active = coupons.filter((c) => c.active);
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0);
  const topCoupon = [...coupons].sort((a, b) => b.usageCount - a.usageCount)[0];
  return {
    activeCount: active.length,
    totalUsage,
    topCoupon: topCoupon
      ? { name: topCoupon.name, code: topCoupon.code, usageCount: topCoupon.usageCount }
      : undefined,
  };
}

export async function listCommercialCoupons(
  active: 'true' | 'false' | 'all' = 'true',
): Promise<CommercialCoupon[]> {
  const params = new URLSearchParams();
  if (active !== 'true') params.set('active', active);
  const qs = params.toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-coupons${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao listar cupons: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as CommercialCoupon[]) : [];
}

export async function getCommercialCoupon(id: string): Promise<CommercialCoupon> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-coupons/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (res.status === 404) {
    throw new Error('Cupom não encontrado.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao buscar cupom: ${res.status}`);
  }
  return (await res.json()) as CommercialCoupon;
}

export async function updateCommercialCoupon(
  id: string,
  payload: UpdateCommercialCouponPayload,
): Promise<CommercialCoupon> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-coupons/${encodeURIComponent(id)}`;
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name.trim();
  if (payload.discountPercent !== undefined) body.discountPercent = payload.discountPercent;
  if (payload.validUntil !== undefined) body.validUntil = payload.validUntil;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 404) {
    throw new Error('Cupom não encontrado.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao atualizar cupom: ${res.status}`);
  }
  return (await res.json()) as CommercialCoupon;
}

export async function createCommercialCoupon(
  payload: CreateCommercialCouponPayload,
): Promise<CommercialCoupon> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-coupons`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: payload.name.trim(),
      discountPercent: payload.discountPercent,
      code: payload.code?.trim() || undefined,
      validUntil: payload.validUntil,
    }),
  });
  if (res.status === 409) {
    throw new Error(
      'Este código de cupom já está em uso. Escolha outro ou deixe em branco para gerar automaticamente.',
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao criar cupom: ${res.status}`);
  }
  return (await res.json()) as CommercialCoupon;
}

export async function checkCommercialCouponUsage(
  codeRaw: string,
  userId: string,
): Promise<CheckCouponUsageResult> {
  const code = normalizeCommercialCouponCode(codeRaw);
  const userIdNorm = userId.trim();
  if (!userIdNorm) {
    throw new Error('Informe o ID do cliente.');
  }

  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-coupons/check-usage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code, userId: userIdNorm }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao verificar cupom: ${res.status}`);
  }

  return (await res.json()) as CheckCouponUsageResult;
}

export async function validateCommercialCoupon(
  codeRaw: string,
  userId: string,
): Promise<MarkCouponUsedResult> {
  const code = normalizeCommercialCouponCode(codeRaw);
  const userIdNorm = userId.trim();
  if (!userIdNorm) {
    throw new Error('Informe o ID do cliente.');
  }
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-coupons/validate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code, userId: userIdNorm }),
  });

  if (res.status === 404) {
    throw new Error('Cupom ou cliente não encontrado.');
  }
  if (res.status === 403) {
    throw new Error('Este cupom pertence a outra loja.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao validar cupom: ${res.status}`);
  }

  return (await res.json()) as MarkCouponUsedResult;
}

export async function deactivateCommercialCoupon(id: string): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-coupons/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  if (res.status === 404) {
    throw new Error('Cupom não encontrado ou já desativado.');
  }
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao desativar cupom: ${res.status}`);
  }
}

export function parseValidUntilToIso(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [, dd, mm, yyyy] = br;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 23, 59, 59, 999);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const [, yyyy, mm, dd] = isoDate;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 23, 59, 59, 999);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return undefined;
}

export function formatValidUntilDisplay(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
