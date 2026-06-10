import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

const PERMISSION_DENIED_MESSAGE =
  'Sem permissão o mapa usa uma região padrão. Você pode ativar nas configurações do app.';

const GPS_DISABLED_MESSAGE =
  'Ative o GPS/localização do dispositivo. Em alguns aparelhos o primeiro fix demora alguns segundos.';

const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;
const WATCH_FIRST_FIX_TIMEOUT_MS = 30_000;
const DEFAULT_GET_POSITION_RETRIES = 4;
const DEFAULT_GET_POSITION_RETRY_DELAY_MS = 2000;

export const GPS_POSITION_TIMEOUT_MS = 12_000;

export class ForegroundLocationError extends Error {
  constructor(
    readonly code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'UNAVAILABLE',
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ForegroundLocationError';
  }
}

export async function ensureForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === 'granted') return true;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Localização', PERMISSION_DENIED_MESSAGE, [
      { text: 'OK', style: 'cancel' },
      { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
    ]);
    return false;
  }
  return true;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message = 'LOCATION_TIMEOUT'): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function ensureLocationServicesEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const enabled = await Location.hasServicesEnabledAsync();
  if (enabled) return true;

  Alert.alert('GPS desativado', GPS_DISABLED_MESSAGE, [
    { text: 'OK', style: 'cancel' },
    { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
  ]);
  return false;
}

function withNativeLocationOptions(
  options?: Location.LocationOptions,
): Location.LocationOptions {
  return {
    accuracy: Location.Accuracy.High,
    ...options,
    ...(Platform.OS === 'android' ? { mayShowUserSettingsDialog: true } : {}),
  };
}

async function tryLastKnownPosition(): Promise<Location.LocationObject | null> {
  try {
    return await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
      requiredAccuracy: 500,
    });
  } catch {
    return null;
  }
}

async function watchForFirstPosition(
  options: Location.LocationOptions,
  timeoutMs: number,
): Promise<Location.LocationObject> {
  return new Promise((resolve, reject) => {
    let subscription: Location.LocationSubscription | null = null;
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.remove();
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => reject(new Error('LOCATION_TIMEOUT')));
    }, timeoutMs);

    void Location.watchPositionAsync(
      {
        ...options,
        distanceInterval: 0,
        timeInterval: 500,
      },
      (location) => {
        finish(() => resolve(location));
      },
    ).then(
      (sub) => {
        subscription = sub;
      },
      (error) => {
        finish(() => reject(error));
      },
    );
  });
}

export async function getCurrentPositionWithRetry(
  options?: Location.LocationOptions,
  retries = DEFAULT_GET_POSITION_RETRIES,
  retryDelayMs = DEFAULT_GET_POSITION_RETRY_DELAY_MS,
  timeoutMs = GPS_POSITION_TIMEOUT_MS,
): Promise<Location.LocationObject> {
  const resolvedOptions = withNativeLocationOptions(options);
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
      return await withTimeout(
        Location.getCurrentPositionAsync(resolvedOptions),
        timeoutMs,
      );
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Origem para rotas: GPS atual → última posição conhecida. */
export async function resolveOriginPositionForDirections(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const ok = await ensureForegroundLocationPermission();
  if (!ok) return null;

  try {
    const pos = await getCurrentPositionWithRetry({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    try {
      const last = await Location.getLastKnownPositionAsync({ maxAge: 600_000 });
      if (last) {
        return { latitude: last.coords.latitude, longitude: last.coords.longitude };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function getForegroundPosition(
  options?: Location.LocationOptions,
): Promise<Location.LocationObject> {
  const permitted = await ensureForegroundLocationPermission();
  if (!permitted) {
    throw new ForegroundLocationError('PERMISSION_DENIED');
  }

  const servicesEnabled = await ensureLocationServicesEnabled();
  if (!servicesEnabled) {
    throw new ForegroundLocationError('SERVICES_DISABLED');
  }

  const resolvedOptions = withNativeLocationOptions(options);

  const lastKnown = await tryLastKnownPosition();
  if (lastKnown) return lastKnown;

  try {
    return await watchForFirstPosition(resolvedOptions, WATCH_FIRST_FIX_TIMEOUT_MS);
  } catch {
    try {
      return await getCurrentPositionWithRetry(resolvedOptions);
    } catch {
      throw new ForegroundLocationError(
        'UNAVAILABLE',
        'Não foi possível obter sua posição. Verifique se o GPS está ativo e tente novamente.',
      );
    }
  }
}
