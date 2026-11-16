import { getApiBaseUrl, getWhitelabelHostId } from '@/services/apiConfig';
import { brandGradient, normalizeHex } from '@/utils/brandColor';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

export type CityBrand = {
  displayName: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  gradient: readonly [string, string, string];
};

const EMPTY: CityBrand = {
  displayName: null,
  primaryColor: null,
  logoUrl: null,
  gradient: brandGradient(null),
};

const CACHE_KEY = 'rota_city_brand_v1';

type CachedBrand = {
  hostId: string;
  displayName: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
};

const CityBrandContext = createContext<{ brand: CityBrand; refresh: () => Promise<void> }>({
  brand: EMPTY,
  refresh: async () => undefined,
});

function readHostId(): string | null {
  try {
    return getWhitelabelHostId();
  } catch {
    return null;
  }
}

function toBrand(cached: CachedBrand | null): CityBrand {
  if (!cached) return EMPTY;
  return {
    displayName: cached.displayName,
    primaryColor: normalizeHex(cached.primaryColor),
    logoUrl: cached.logoUrl,
    gradient: brandGradient(cached.primaryColor),
  };
}

async function readCache(hostId: string): Promise<CachedBrand | null> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CACHE_KEY);
      const parsed = raw ? (JSON.parse(raw) as CachedBrand) : null;
      return parsed?.hostId === hostId ? parsed : null;
    }
    const mod = require('@react-native-async-storage/async-storage');
    const AsyncStorage = mod.default ?? mod;
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CachedBrand) : null;
    return parsed?.hostId === hostId ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCache(value: CachedBrand): Promise<void> {
  try {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, raw);
      return;
    }
    const mod = require('@react-native-async-storage/async-storage');
    const AsyncStorage = mod.default ?? mod;
    await AsyncStorage.setItem(CACHE_KEY, raw);
  } catch {
    /* a identidade volta na próxima leitura da API */
  }
}

async function fetchBrand(hostId: string): Promise<CachedBrand> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/projects/hosts/${encodeURIComponent(hostId)}/branding`);
  if (!response.ok) {
    throw new Error('branding');
  }
  const data = (await response.json()) as {
    displayName?: string;
    primaryColor?: string | null;
    logoPath?: string | null;
  };
  return {
    hostId,
    displayName: data.displayName?.trim() || null,
    primaryColor: data.primaryColor ?? null,
    logoUrl: data.logoPath ? `${base}${data.logoPath}` : null,
  };
}

export function CityBrandProvider({ children }: { children: React.ReactNode }) {
  const hostId = readHostId();
  const [brand, setBrand] = useState<CityBrand>(EMPTY);

  const refresh = useCallback(async () => {
    if (!hostId) return;
    try {
      const next = await fetchBrand(hostId);
      await writeCache(next);
      setBrand(toBrand(next));
    } catch {
      const cached = await readCache(hostId);
      if (cached) setBrand(toBrand(cached));
    }
  }, [hostId]);

  useEffect(() => {
    if (!hostId) return;
    let alive = true;
    void readCache(hostId).then((cached) => {
      if (alive && cached) setBrand(toBrand(cached));
    });
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      alive = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [hostId, refresh]);

  const value = useMemo(() => ({ brand, refresh }), [brand, refresh]);
  return <CityBrandContext.Provider value={value}>{children}</CityBrandContext.Provider>;
}

export function useCityBrand(): CityBrand {
  return useContext(CityBrandContext).brand;
}
