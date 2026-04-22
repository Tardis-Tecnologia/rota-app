import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const BASE_PATH = '/api/v1';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface LoginResponseBody {
  token: string;
  name?: string | null;
  profile: string;
  themeSlug?: string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
}

export interface LoginSuccess {
  token: string;
  userId: string;
  name?: string | null;
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
}

let authToken: string | null = null;

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL não definida');
  }
  return API_BASE_URL.replace(/\/$/, '');
}

function pickPhotoUrl(raw: Record<string, unknown>): string | null | undefined {
  const v = raw.photoUrl ?? raw.photo_url;
  if (v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length ? t : null;
  }
  return undefined;
}

function mapUserSummary(raw: unknown): UserSummary {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Resposta inválida do servidor');
  }
  const r = raw as Record<string, unknown>;
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
    photoUrl: pickPhotoUrl(r) ?? null,
  };
}

export async function getUserById(userId: string): Promise<UserSummary> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/users/${encodeURIComponent(userId)}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao buscar usuário: ${res.status}`);
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

  const mime = options?.mimeType?.trim() || 'image/jpeg';
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

  if (res.status === 401) {
    throw new Error('EMAIL_OU_SENHA_INCORRETOS');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro no login: ${res.status}`);
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
    profile: data.profile,
    themeSlug: data.themeSlug ?? null,
    photoUrl: pickPhotoUrl(data as unknown as Record<string, unknown>) ?? null,
  };
}

export async function loginWithGoogle(idToken: string): Promise<GoogleLoginSuccess> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/google-login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorBody(text) || `Erro no login com Google: ${res.status}`);
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

  return {
    token,
    user: {
      id: String(userRaw.id ?? ''),
      email: String(userRaw.email ?? '').trim().toLowerCase(),
      name: String(userRaw.name ?? '').trim(),
      profile: String(userRaw.profile ?? 'CIDADAO'),
      themeSlug: (userRaw.themeSlug as string | null | undefined) ?? null,
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

export function getWhitelabelHostId(): string {
  const raw = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  if (!raw) {
    throw new Error('EXPO_PUBLIC_HOST_ID não definida');
  }
  if (!UUID_REGEX.test(raw)) {
    throw new Error('EXPO_PUBLIC_HOST_ID inválida: informe um UUID válido');
  }
  return raw;
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