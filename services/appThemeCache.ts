import { Platform } from 'react-native';

const KEY_NAME = 'rota_app_theme_name';
const KEY_BG = 'rota_app_theme_background_color';

export interface CachedAppTheme {
  name: string;
  backgroundColor: string;
}

/** Quando o AsyncStorage nativo não existe mantém só na sessão. */
let memoryFallback: CachedAppTheme | null = null;
let nativePersistenceDisabled = false;

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function nativeGetSet(
  op: 'get' | 'set',
  theme?: CachedAppTheme,
): Promise<CachedAppTheme | null | void> {
  if (nativePersistenceDisabled) {
    if (op === 'get') return memoryFallback;
    if (op === 'set' && theme) memoryFallback = theme;
    return;
  }
  try {
    const mod = require('@react-native-async-storage/async-storage');
    const AsyncStorage = mod.default ?? mod;
    if (op === 'get') {
      const [n, bg] = await Promise.all([
        AsyncStorage.getItem(KEY_NAME),
        AsyncStorage.getItem(KEY_BG),
      ]);
      if (!n || !bg) return null;
      return { name: n, backgroundColor: bg };
    }
    if (theme) {
      await Promise.all([
        AsyncStorage.setItem(KEY_NAME, theme.name),
        AsyncStorage.setItem(KEY_BG, theme.backgroundColor),
      ]);
      memoryFallback = theme;
    }
  } catch {
    nativePersistenceDisabled = true;
    if (op === 'get') return memoryFallback;
    if (op === 'set' && theme) memoryFallback = theme;
  }
}

export async function getCachedAppTheme(): Promise<CachedAppTheme | null> {
  const ls = webStorage();
  if (ls) {
    try {
      const n = ls.getItem(KEY_NAME);
      const bg = ls.getItem(KEY_BG);
      if (n && bg) return { name: n, backgroundColor: bg };
    } catch {
      /* ignore */
    }
    return null;
  }
  return (await nativeGetSet('get')) as CachedAppTheme | null;
}

export async function setCachedAppTheme(theme: CachedAppTheme): Promise<void> {
  memoryFallback = theme;
  const ls = webStorage();
  if (ls) {
    try {
      ls.setItem(KEY_NAME, theme.name);
      ls.setItem(KEY_BG, theme.backgroundColor);
    } catch {
      /* ignore */
    }
    return;
  }
  await nativeGetSet('set', theme);
}
