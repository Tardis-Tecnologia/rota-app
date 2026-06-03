import type { ServiceProviderResponse } from '@/types/serviceProvider';

const cache = new Map<string, { data: ServiceProviderResponse; loadedAt: number }>();

export function getCachedServiceProvider(id: string): ServiceProviderResponse | null {
  return cache.get(id)?.data ?? null;
}

export function setCachedServiceProvider(id: string, data: ServiceProviderResponse): void {
  cache.set(id, { data, loadedAt: Date.now() });
}

export function patchCachedServiceProvider(
  id: string,
  patch: Partial<ServiceProviderResponse>,
): void {
  const entry = cache.get(id);
  if (!entry) return;
  entry.data = { ...entry.data, ...patch };
  entry.loadedAt = Date.now();
}
