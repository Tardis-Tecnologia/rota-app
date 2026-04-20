import { getApiBaseUrl, getWhitelabelHostId } from './authApi';

const BASE_PATH = '/api/v1/stream-chat';

export function streamChatUrl(path: string): string {
  const trimmed = path.replace(/^\//, '');
  const join = trimmed.includes('?') ? '&' : '?';
  return `${getApiBaseUrl()}${BASE_PATH}/${trimmed}${join}hostId=${encodeURIComponent(getWhitelabelHostId())}`;
}
