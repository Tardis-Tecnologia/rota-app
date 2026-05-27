import { Linking, Platform } from 'react-native';

export function openExternalDirections(
  latitude: number,
  longitude: number,
  label?: string,
): void {
  const dest = `${latitude},${longitude}`;
  const url =
    Platform.OS === 'ios'
      ? `maps://app?daddr=${dest}${label ? `&q=${encodeURIComponent(label)}` : ''}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  void Linking.openURL(url);
}
