import { FORUM_ACCOUNT_BANNED_ERROR } from './forumBanNoticeStore';
import {
  ensureAuthTokenHydrated,
  getApiBaseUrl,
  getAuthToken,
  getWhitelabelHostId,
  setAuthToken,
} from './apiConfig';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';
import { isForumInactiveUserMessage } from '@/utils/forumPostingSuspensionParse';

export {
  buildAuthHeaders,
  ensureAuthTokenHydrated,
  getApiBaseUrl,
  getAuthToken,
  getWhitelabelHostId,
  setAuthToken,
} from './apiConfig';

const BASE_PATH = '/api/v1';

interface LoginResponseBody {
  token: string;
  name?: string | null;
  cpf?: string | null;
  profile: string;
  themeSlug?: string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
}

export interface LoginSuccess {
  token: string;
  userId: string;
  name?: string | null;
  cpf?: string | null;
  profile: string;
  themeSlug: string | null;
  photoUrl: string | null;
}

export interface GoogleLoginSuccess {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    profile: string;
    themeSlug: string | null;
    uf?: string | null;
    govbrSub?: string | null;
    cpf?: string | null;
    photoUrl?: string | null;
  };
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  active: boolean;
  profile?: string;
  govbrSub?: string;
  uf?: string;
  cpf?: string;
  photoUrl?: string | null;
  bio?: string | null;
  official?: { institution: string; roleTitle: string; verified: true } | null;
}

function pickPhotoUrl(raw: Record<string, unknown>): string | null | undefined {
  const hasPhotoKey =
    Object.prototype.hasOwnProperty.call(raw, 'photoUrl') ||
    Object.prototype.hasOwnProperty.call(raw, 'photo_url');
  if (!hasPhotoKey) {
    return undefined;
  }
  const v = raw.photoUrl ?? raw.photo_url;
  if (v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length ? t : null;
  }
  return null;
}

function normalizeProfileUploadMime(mime?: string | null): string {
  const m = (mime ?? '').trim().toLowerCase();
  if (!m) return 'image/jpeg';
  if (m === 'image/jpg' || m === 'image/x-jpeg' || m === 'image/pjpeg') {
    return 'image/jpeg';
  }
  if (m === 'image/x-png') {
    return 'image/png';
  }
  return m;
}

function mapUserSummary(raw: unknown): UserSummary {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Resposta inválida do servidor');
  }
  const r = raw as Record<string, unknown>;
  const photoPick = pickPhotoUrl(r);
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    email: String(r.email ?? ''),
    active: Boolean(r.active),
    profile: typeof r.profile === 'string' ? r.profile : undefined,
    govbrSub:
      typeof r.govbrSub === 'string'
        ? r.govbrSub
        : typeof r.govbr_sub === 'string'
          ? r.govbr_sub
          : undefined,
    uf: typeof r.uf === 'string' ? r.uf : undefined,
    cpf: typeof r.cpf === 'string' ? r.cpf : undefined,
    ...(photoPick !== undefined ? { photoUrl: photoPick } : {}),
    ...(typeof r.bio === 'string' || r.bio === null
      ? { bio: typeof r.bio === 'string' ? r.bio.trim() || null : null }
      : {}),
    official: mapOfficialIdentity(r.official),
  };
}

function mapOfficialIdentity(
  value: unknown,
): { institution: string; roleTitle: string; verified: true } | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const institution = typeof row.institution === 'string' ? row.institution.trim() : '';
  const roleTitle = typeof row.roleTitle === 'string' ? row.roleTitle.trim() : '';
  if (!institution || !roleTitle || row.verified !== true) return null;
  return { institution, roleTitle, verified: true };
}

export class AuthHttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthHttpError';
    this.status = status;
  }
}

export async function getUserById(userId: string): Promise<UserSummary> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/users/${encodeURIComponent(userId)}`;
  const token = (await ensureAuthTokenHydrated()) || getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AuthHttpError(res.status, text || `Erro ao buscar usuário: ${res.status}`);
  }
  const raw = await res.json();
  return mapUserSummary(raw);
}

export type UpdateUserProfilePayload = {
  name?: string;
  email?: string;
  uf?: string | null;
  govbrSub?: string | null;
  cpf?: string | null;
  password?: string;
  bio?: string | null;
};

export async function updateUserProfile(
  userId: string,
  payload: UpdateUserProfilePayload,
): Promise<UserSummary> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/users/${encodeURIComponent(userId)}`;
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(url, { method: 'PUT', headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorBody(text) || `Erro ao atualizar perfil: ${res.status}`);
  }
  const raw = await res.json();
  return mapUserSummary(raw);
}

export interface UploadProfilePhotoSuccess {
  photoUrl: string;
}

export async function uploadMyProfilePhotoFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<UploadProfilePhotoSuccess> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }

  const mime = normalizeProfileUploadMime(options?.mimeType);
  const name = options?.fileName?.trim() || 'profile-photo.jpg';

  const form = new FormData();
  form.append('file', {
    uri,
    name,
    type: mime,
  } as unknown as Blob);

  const url = `${getApiBaseUrl()}${BASE_PATH}/users/me/profile-photo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorBody(text) || `Erro no upload da foto: ${res.status}`);
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const photo = pickPhotoUrl(raw);
  if (!photo) {
    throw new Error('Resposta inválida ao enviar foto de perfil');
  }
  return { photoUrl: photo };
}

export async function login(
  email: string,
  password: string
): Promise<LoginSuccess> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAuthLoginFailure(res.status, text);
  }

  const data = (await res.json()) as LoginResponseBody;
  if (!data?.token || typeof data.profile !== 'string') {
    throw new Error('Resposta inválida do servidor');
  }
  let claims;
  try {
    claims = parseJwtAccessTokenPayload(data.token);
  } catch {
    throw new Error('Token de login inválido');
  }
  const userId = (claims.userId ?? claims.sub)?.trim();
  if (!userId) {
    throw new Error('Token sem identificação de usuário');
  }
  return {
    token: data.token,
    userId,
    name: data.name ?? null,
    cpf: typeof data.cpf === 'string' ? data.cpf : null,
    profile: data.profile,
    themeSlug: data.themeSlug ?? null,
    photoUrl: pickPhotoUrl(data as unknown as Record<string, unknown>) ?? null,
  };
}

export async function loginWithGoogle(idToken: string): Promise<GoogleLoginSuccess> {
  const hostId = getWhitelabelHostId();
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/google-login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ idToken, hostId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAuthLoginFailure(res.status, text);
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const token = String(raw.accessToken ?? raw.token ?? '').trim();
  if (!token) {
    throw new Error('Resposta inválida no login com Google: token ausente');
  }

  const userRaw =
    raw.user && typeof raw.user === 'object'
      ? (raw.user as Record<string, unknown>)
      : (raw as Record<string, unknown>);

  let userId = String(userRaw.id ?? '').trim();
  if (!userId) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      userId = String((claims.userId ?? claims.sub) ?? '').trim();
    } catch {
      // ignore and fallback to empty string
    }
  }

  return {
    token,
    user: {
      id: userId,
      email: String(userRaw.email ?? raw.email ?? '').trim().toLowerCase(),
      name: String(userRaw.name ?? raw.name ?? '').trim(),
      profile: String(userRaw.profile ?? raw.profile ?? 'CIDADAO'),
      themeSlug:
        (userRaw.themeSlug as string | null | undefined) ??
        (raw.themeSlug as string | null | undefined) ??
        null,
      uf: (userRaw.uf as string | null | undefined) ?? undefined,
      govbrSub:
        (userRaw.govbrSub as string | null | undefined) ??
        (userRaw.govbr_sub as string | null | undefined) ??
        undefined,
      cpf: (userRaw.cpf as string | null | undefined) ?? undefined,
      photoUrl: pickPhotoUrl(userRaw) ?? null,
    },
  };
}

function throwAuthLoginFailure(status: number, text: string): never {
  const message = parseApiErrorBody(text);
  if (
    (status === 401 || status === 403) &&
    isForumInactiveUserMessage(message)
  ) {
    throw new Error(FORUM_ACCOUNT_BANNED_ERROR);
  }
  if (status === 401) {
    throw new Error('EMAIL_OU_SENHA_INCORRETOS');
  }
  throw new Error(message || `Erro no login: ${status}`);
}

function parseApiErrorBody(text: string): string {
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(j.message)) {
      return j.message.join(', ');
    }
    if (typeof j.message === 'string') {
      return j.message;
    }
  } catch {
    /* ignore */
  }
  return text || 'Erro inesperado';
}

export async function registerCitizen(
  name: string,
  email: string,
  password: string,
  cpf: string,
): Promise<void> {
  const hostId = getWhitelabelHostId();
  const url = `${getApiBaseUrl()}${BASE_PATH}/users/register`;
  const body: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    hostId: string;
  } = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    cpf: cpf.replace(/\D/g, ''),
    hostId,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 409) {
      throw new Error('EMAIL_JA_CADASTRADO');
    }
    throw new Error(parseApiErrorBody(text) || `Erro no cadastro: ${res.status}`);
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/forgot-password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro ao enviar código: ${res.status}`);
  }

  return (await res.json()) as { message: string };
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<{ valid: true }> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/verify-reset-code`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code: code.trim(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro ao validar código: ${res.status}`);
  }

  return (await res.json()) as { valid: true };
}

export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/reset-password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro ao redefinir senha: ${res.status}`);
  }

  return (await res.json()) as { message: string };
}