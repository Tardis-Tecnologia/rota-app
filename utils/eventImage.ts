import { getApiBaseUrl, getAuthToken } from '@/services/authApi';
import type { EventItem } from '@/services/eventsService';

export function resolveEventImageUrl(
  item: Pick<EventItem, 'image' | 'imageId'>,
): string | undefined {
  const image = item.image;
  const publicUrl = image?.publicUrl?.trim();
  if (publicUrl) {
    if (publicUrl.startsWith('http://') || publicUrl.startsWith('https://')) {
      return publicUrl;
    }
    if (publicUrl.startsWith('/')) {
      return `${getApiBaseUrl()}${publicUrl}`;
    }
    return publicUrl;
  }

  const imageId = image?.id?.trim() || item.imageId?.trim();
  if (imageId) {
    return `${getApiBaseUrl()}/api/v1/upload/files/${encodeURIComponent(imageId)}`;
  }

  const path = image?.path?.trim();
  if (path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('/')) {
      return `${getApiBaseUrl()}${path}`;
    }
  }

  return undefined;
}

export function eventImageSource(uri: string | undefined): {
  uri: string;
  headers?: { Authorization: string };
} | null {
  if (!uri?.trim()) return null;
  const normalized = uri.trim();
  const token = getAuthToken();
  const base = getApiBaseUrl();
  const needsAuth =
    normalized.includes('/api/v1/upload/files/') ||
    normalized.startsWith(base);
  return {
    uri: normalized,
    ...(token && needsAuth ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };
}
