import { getApiBaseUrl } from '@/services/authApi';

export type NeighborhoodTraffic = {
  status: string;
  currentSpeed: number;
  freeFlowSpeed: number;
};

export type NeighborhoodEvent = {
  name: string;
  date: string;
  time: string;
};

export type NeighborhoodSummary = {
  traffic: NeighborhoodTraffic | null;
  events: {
    event: NeighborhoodEvent | null;
  };
  errors: {
    traffic: string | null;
    events: string | null;
  };
};

export async function getNeighborhoodTraffic(params: {
  lat: number;
  lon: number;
}): Promise<NeighborhoodTraffic> {
  const url = new URL('/api/v1/neighborhood/traffic', getApiBaseUrl());
  url.searchParams.set('lat', String(params.lat));
  url.searchParams.set('lon', String(params.lon));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `neighborhood/traffic failed (${res.status})`);
  }

  return (await res.json()) as NeighborhoodTraffic;
}

export async function getNeighborhoodSummary(params: {
  lat: number;
  lon: number;
}): Promise<NeighborhoodSummary> {
  const url = new URL('/api/v1/neighborhood/summary', getApiBaseUrl());
  url.searchParams.set('lat', String(params.lat));
  url.searchParams.set('lon', String(params.lon));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `neighborhood/summary failed (${res.status})`);
  }

  return (await res.json()) as NeighborhoodSummary;
}
