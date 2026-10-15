import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from './authApi';

const BASE_PATH = '/api/v1';
const TIMEOUT_MS = 30_000;

type Query = Record<string, string | number | boolean | null | undefined>;

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const json = JSON.parse(raw) as { message?: unknown };
      if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
      if (Array.isArray(json.message) && json.message.length) return String(json.message[0]);
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

/** Host da cidade atual (whitelabel). */
export function currentHostId(): string {
  return getWhitelabelHostId();
}

/**
 * Requisição autenticada para os serviços públicos (Educação, Saúde).
 * Lança Error com a mensagem do backend quando a resposta não é 2xx.
 */
export async function publicServicesRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; query?: Query; body?: unknown } = {},
): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Faça login para continuar.');

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}${path}${qs ? `?${qs}` : ''}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('O servidor demorou para responder. Verifique sua conexão e tente novamente.');
    }
    throw error instanceof Error ? error : new Error('Falha de conexão');
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(await readErrorMessage(res));
  const raw = await res.text();
  return (raw.trim() ? JSON.parse(raw) : undefined) as T;
}

/** "AAAA-MM-DD" -> "DD/MM/AAAA". */
export function isoDateToBr(value: string | null | undefined): string {
  if (!value) return '';
  const [yyyy, mm, dd] = value.slice(0, 10).split('-');
  return dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : value;
}
