import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

export type ServiceProviderRegistrationPayload = {
  displayName: string;
  /** Texto livre informado pelo prestador — serviço principal */
  professionCustom: string;
  /** Categoria sugerida quando o usuário usa um atalho (opcional) */
  professionCategoryId?: string;
  cnpj: string;
  phone: string;
  email: string;
  description: string;
  serviceArea: string;
  cep?: string;
  locationName?: string;
  locationAddress?: string;
  streetNumber?: string;
  businessHours?: string;
};

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

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Envia pedido de inclusão no Guia como prestador.
 * Endpoint esperado no back: POST .../city-guide/service-provider-registrations
 * (404/405 = API ainda não publicada — usar fallback por e-mail na UI).
 */
export async function submitServiceProviderRegistration(
  body: ServiceProviderRegistrationPayload,
): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/city-guide/service-provider-registrations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 404 || res.status === 405) {
    const err = new Error('GUIA_CADASTRO_ENDPOINT_INDISPONIVEL');
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
}
