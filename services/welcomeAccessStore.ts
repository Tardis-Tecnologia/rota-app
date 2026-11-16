import { Platform } from 'react-native';

const KEY = 'rota_has_logged_in_before';

let memoryFlag: boolean | null = null;
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

async function nativeGet(): Promise<boolean> {
  if (nativePersistenceDisabled) return memoryFlag === true;
  try {
    const mod = require('@react-native-async-storage/async-storage');
    const AsyncStorage = mod.default ?? mod;
    const raw = await AsyncStorage.getItem(KEY);
    return raw === '1';
  } catch {
    nativePersistenceDisabled = true;
    return memoryFlag === true;
  }
}

async function nativeSet(): Promise<void> {
  memoryFlag = true;
  if (nativePersistenceDisabled) return;
  try {
    const mod = require('@react-native-async-storage/async-storage');
    const AsyncStorage = mod.default ?? mod;
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    nativePersistenceDisabled = true;
  }
}

/** Já entrou com conta neste aparelho / navegador. */
export async function hasLoggedInBefore(): Promise<boolean> {
  const web = webStorage();
  if (web) {
    try {
      return web.getItem(KEY) === '1';
    } catch {
      return memoryFlag === true;
    }
  }
  return nativeGet();
}

/** Marca que o usuário já fez login (próximos acessos = “bem-vindo de volta”). */
export async function markHasLoggedInBefore(): Promise<void> {
  memoryFlag = true;
  const web = webStorage();
  if (web) {
    try {
      web.setItem(KEY, '1');
      return;
    } catch {
      /* fall through */
    }
  }
  await nativeSet();
}
