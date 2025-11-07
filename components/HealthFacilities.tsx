import { AppColors } from '@/constants/theme';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export interface HealthFacilityItem {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: 'open' | 'closed';
  image: string;
}

const DEFAULT_FACILITIES: HealthFacilityItem[] = [
  { id: 'hospital-lourenco', name: 'Hospital Lourenço Jorge', address: 'Av. Ayrton Senna, 2000 - Barra da Tijuca', distance: '1,2 km', status: 'open', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&auto=format&fit=crop&q=60' },
  { id: 'copa-star', name: "Copa Star - Hospital Copa D'Or", address: 'Av. das Américas, 4666 - Barra da Tijuca', distance: '2,3 km', status: 'open', image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200&auto=format&fit=crop&q=60' },
  { id: 'hospital-barra', name: "Hospital Barra D'Or", address: 'Av. Ayrton Senna, 2541 - Barra da Tijuca', distance: '1,8 km', status: 'open', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=200&auto=format&fit=crop&q=60' },
  { id: 'hospital-niteroi', name: "Hospital Niterói D'Or", address: 'Rua da Conceição, 188 - Centro, Niterói', distance: '15,5 km', status: 'open', image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=200&auto=format&fit=crop&q=60' },
  { id: 'clinica-familia', name: 'Clínica da Família Barra da Tijuca', address: 'Av. Armando Lombardi, 800 - Barra da Tijuca', distance: '3,2 km', status: 'closed', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&auto=format&fit=crop&q=60' },
];

const STATUS_COLORS = {
  open: { dot: '#22c55e', text: '#15803d' },
  closed: { dot: '#ef4444', text: '#b91c1c' },
} as const;

export interface HealthFacilitiesProps {
  facilities?: HealthFacilityItem[];
  onSelect?: (item: HealthFacilityItem) => void;
}

export default function HealthFacilities({ facilities = DEFAULT_FACILITIES, onSelect }: HealthFacilitiesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hospitais Próximos</Text>
      <Text style={styles.subtitle}>Encontre unidades de saúde perto de você</Text>
      <View style={styles.list}>
        {facilities.map((facility) => (
          <Pressable key={facility.id} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => onSelect?.(facility)}>
            <Image source={{ uri: facility.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{facility.name}</Text>
              <Text style={styles.address} numberOfLines={1}>{facility.address}</Text>
              <View style={styles.footer}>
                <View style={styles.statusWrapper}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[facility.status].dot }]} />
                  <Text style={[styles.statusLabel, { color: STATUS_COLORS[facility.status].text }]}>{facility.status === 'open' ? 'Aberto' : 'Fechado'}</Text>
                </View>
                <Text style={styles.distance}>{facility.distance}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: AppColors.text.secondary },
  subtitle: { fontSize: 14, color: AppColors.text.tertiary },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: { shadowOpacity: 0.2, transform: [{ scale: 0.98 }] },
  image: { width: 80, height: 80, borderRadius: 16, backgroundColor: AppColors.gray[200] },
  info: { flex: 1, minWidth: 0, gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  address: { fontSize: 13, color: AppColors.text.tertiary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statusWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  distance: { fontSize: 13, fontWeight: '600', color: AppColors.text.secondary },
});

