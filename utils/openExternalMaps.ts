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

/** Abre o app de mapas com busca por endereço ou ponto de referência. */
export function openMapsSearchQuery(query: string, label?: string): void {
  const q = query.trim();
  if (!q) return;
  const encoded = encodeURIComponent(label?.trim() ? `${label.trim()} (${q})` : q);
  const url =
    Platform.OS === 'ios'
      ? `maps://?q=${encoded}`
      : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  void Linking.openURL(url);
}
