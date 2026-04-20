import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';
const PUBLIC_HOST_ID = process.env.EXPO_PUBLIC_HOST_ID?.trim();

export interface EmergencyAlertItem {
  hostId?: string | null;
  id: string;
  title: string;
  description: string | null;
  level: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

function appendHostId(path: string): string {
  if (!PUBLIC_HOST_ID) {
    throw new Error('EXPO_PUBLIC_HOST_ID não definida');
  }
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}hostId=${encodeURIComponent(PUBLIC_HOST_ID)}`;
}

async function fetchEmergencyAlerts(endpoint: string): Promise<EmergencyAlertItem[]> {
  const url = `${getApiBaseUrl()}${BASE_PATH}${appendHostId(endpoint)}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Erro ao carregar alertas: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getEmergencyAlerts(options?: {
  init?: number;
  end?: number;
}): Promise<EmergencyAlertItem[]> {
  const params = new URLSearchParams();
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const qs = params.toString();
  const endpoint = qs ? `/emergency-alert?${qs}` : '/emergency-alert';
  return fetchEmergencyAlerts(endpoint);
}
