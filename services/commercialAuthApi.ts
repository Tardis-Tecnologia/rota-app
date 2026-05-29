import { getApiBaseUrl, getWhitelabelHostId } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';
import type { LoginSuccess } from './authApi';

export type CommercialLoginSuccess = LoginSuccess & {
  commercialCep?: string | null;
  commercialCnpj?: string | null;
};

const BASE_PATH = '/api/v1';

interface CommercialLoginResponseBody {
  token: string;
  email: string;
  name?: string | null;
  profile: string;
  themeSlug?: string | null;
  photoUrl?: string | null;
  cep?: string | null;
  cnpj?: string | null;
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

export interface RegisterCommercialAccountPayload {
  storeName: string;
  email: string;
  responsibleName: string;
  phone: string;
  password: string;
  cnpj?: string;
  segment?: string;
  address?: string;
  cep?: string;
  description?: string;
  hostId?: string;
}

export async function loginCommercial(
  email: string,
  password: string,
): Promise<CommercialLoginSuccess> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (res.status === 401) {
    const text = await res.text().catch(() => '');
    const message = parseApiErrorBody(text);
    throw new Error(message || 'EMAIL_OU_SENHA_INCORRETOS');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorBody(text) || `Erro no login comercial: ${res.status}`);
  }

  const data = (await res.json()) as CommercialLoginResponseBody;
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

  const photoUrl =
    typeof data.photoUrl === 'string' && data.photoUrl.trim()
      ? data.photoUrl.trim()
      : null;

  return {
    token: data.token,
    userId,
    name: data.name?.trim() || null,
    profile: data.profile,
    themeSlug: data.themeSlug ?? null,
    photoUrl,
    commercialCep:
      typeof data.cep === 'string' && data.cep.trim() ? data.cep.trim() : null,
    commercialCnpj:
      typeof data.cnpj === 'string' && data.cnpj.trim() ? data.cnpj.trim() : null,
  };
}

export async function registerCommercialAccount(
  payload: RegisterCommercialAccountPayload,
): Promise<{ message: string }> {
  let hostId: string | undefined;
  try {
    hostId = getWhitelabelHostId();
  } catch {
    hostId = payload.hostId;
  }

  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial-auth/register`;
  const body: RegisterCommercialAccountPayload = {
    storeName: payload.storeName.trim(),
    email: payload.email.trim(),
    responsibleName: payload.responsibleName.trim(),
    phone: payload.phone.trim(),
    password: payload.password,
    cnpj: payload.cnpj?.trim() || undefined,
    segment: payload.segment?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    cep: payload.cep?.trim() || undefined,
    description: payload.description?.trim() || undefined,
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
    const text = await res.text().catch(() => '');
    if (res.status === 409) {
      throw new Error(parseApiErrorBody(text) || 'E-mail já cadastrado.');
    }
    throw new Error(parseApiErrorBody(text) || `Erro ao solicitar parceria: ${res.status}`);
  }

  const data = (await res.json()) as { message?: string };
  return {
    message:
      data.message ??
      'Solicitação recebida. Nossa equipe analisará seu pedido e entrará em contato.',
  };
}
