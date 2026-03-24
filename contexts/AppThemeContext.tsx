import { AppColors } from '@/constants/theme';
import * as appThemeApi from '@/services/appThemeApi';
import { registerAppThemeRefresh } from '@/services/appThemeBridge';
import { getCachedAppTheme, setCachedAppTheme } from '@/services/appThemeCache';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const FALLBACK_BG = AppColors.background.light;

interface AppThemeContextValue {
  name: string;
  backgroundColor: string;
  refreshFromApi: () => Promise<void>;
  syncThemeOnNavigation: () => Promise<void>;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function themesEqual(
  a: { name: string; backgroundColor: string } | null,
  b: { name: string; backgroundColor: string },
): boolean {
  if (!a) return false;
  return a.name === b.name && a.backgroundColor === b.backgroundColor;
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState('Default');
  const [backgroundColor, setBackgroundColor] = useState(FALLBACK_BG);
  const lastNavSyncAt = useRef(0);

  const applyTheme = useCallback((next: { name: string; backgroundColor: string }) => {
    setName(next.name);
    setBackgroundColor(next.backgroundColor);
  }, []);

  const refreshFromApi = useCallback(async () => {
    try {
      const data = await appThemeApi.fetchActiveAppTheme();
      await setCachedAppTheme(data);
      applyTheme(data);
    } catch {
      const cached = await getCachedAppTheme();
      if (cached) applyTheme(cached);
    }
  }, [applyTheme]);

  const syncThemeOnNavigation = useCallback(async () => {
    const now = Date.now();
    if (now - lastNavSyncAt.current < 300000) return;
    lastNavSyncAt.current = now;
    try {
      const remote = await appThemeApi.fetchActiveAppTheme();
      const cached = await getCachedAppTheme();
      if (themesEqual(cached, remote)) return;
      await setCachedAppTheme(remote);
      applyTheme(remote);
    } catch {
      /* mantém cache e estado atuais */
    }
  }, [applyTheme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await getCachedAppTheme();
      if (!cancelled && cached) applyTheme(cached);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyTheme]);

  useEffect(() => {
    registerAppThemeRefresh(refreshFromApi);
    return () => registerAppThemeRefresh(null);
  }, [refreshFromApi]);

  const value = useMemo(
    () => ({
      name,
      backgroundColor,
      refreshFromApi,
      syncThemeOnNavigation,
    }),
    [name, backgroundColor, refreshFromApi, syncThemeOnNavigation],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return ctx;
}
