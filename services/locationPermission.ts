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
const DEFAULT_GET_POSITION_TIMEOUT_MS = 15_000;

export const LOCATION_TIMEOUT_ERROR = 'LOCATION_TIMEOUT';

function getCurrentPositionWithTimeout(
  options?: Location.LocationOptions,
  timeoutMs = DEFAULT_GET_POSITION_TIMEOUT_MS,
): Promise<Location.LocationObject> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(LOCATION_TIMEOUT_ERROR)), timeoutMs);
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      ...options,
    })
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

export async function getCurrentPositionWithRetry(
  options?: Location.LocationOptions,
  retries = DEFAULT_GET_POSITION_RETRIES,
  retryDelayMs = DEFAULT_GET_POSITION_RETRY_DELAY_MS,
  timeoutMs = DEFAULT_GET_POSITION_TIMEOUT_MS,
): Promise<Location.LocationObject> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
      return await getCurrentPositionWithTimeout(options, timeoutMs);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
