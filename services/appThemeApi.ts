import { getApiBaseUrl } from './authApi';

const BASE_PATH = '/api/v1';

export interface AppThemeActivePayload {
  name: string;
  backgroundColor: string;
}

export async function fetchActiveAppTheme(): Promise<AppThemeActivePayload> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/app-theme/active`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`app-theme/active: ${res.status}`);
  }
  return res.json() as Promise<AppThemeActivePayload>;
}
