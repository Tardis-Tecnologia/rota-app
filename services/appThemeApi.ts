import { getApiBaseUrl } from './authApi';

const BASE_PATH = '/api/v1';
const PUBLIC_HOST_ID = process.env.EXPO_PUBLIC_HOST_ID?.trim();

export interface AppThemeActivePayload {
  hostId: string;
  name: string;
  backgroundColor: string;
}

export async function fetchActiveAppTheme(): Promise<AppThemeActivePayload> {
  if (!PUBLIC_HOST_ID) {
    throw new Error('EXPO_PUBLIC_HOST_ID não definida');
  }
  const url = `${getApiBaseUrl()}${BASE_PATH}/app-theme/active?hostId=${encodeURIComponent(PUBLIC_HOST_ID)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`app-theme/active: ${res.status}`);
  }
  return res.json() as Promise<AppThemeActivePayload>;
}
