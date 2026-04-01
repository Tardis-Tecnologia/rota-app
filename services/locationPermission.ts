import * as Location from 'expo-location';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export async function ensureForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permitir localização',
        message:
          'O app precisa da sua localização para mostrar pontos próximos e sua posição no mapa.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Localização',
        'Sem permissão o mapa usa uma região padrão. Você pode ativar nas configurações do app.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  }

  if (Platform.OS === 'ios') {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão negada',
        'A localização é necessária para mostrar sua posição no mapa.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  }

  return false;
}
