import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

const PERMISSION_DENIED_MESSAGE =
  'Sem permissão o mapa usa uma região padrão. Você pode ativar nas configurações do app.';

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

const DEFAULT_GET_POSITION_RETRIES = 2;
const DEFAULT_GET_POSITION_RETRY_DELAY_MS = 1500;
export const GPS_POSITION_TIMEOUT_MS = 12_000;

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

export async function getCurrentPositionWithRetry(
  options?: Location.LocationOptions,
  retries = DEFAULT_GET_POSITION_RETRIES,
  retryDelayMs = DEFAULT_GET_POSITION_RETRY_DELAY_MS,
  timeoutMs = GPS_POSITION_TIMEOUT_MS,
): Promise<Location.LocationObject> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
      return await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          ...options,
        }),
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
      const last = await Location.getLastKnownPositionAsync({ maximumAge: 600_000 });
      if (last) {
        return { latitude: last.coords.latitude, longitude: last.coords.longitude };
      }
    } catch {
      // ignore
    }
  }
  return null;
}
