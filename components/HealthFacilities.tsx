import { AppColors } from '@/constants/theme';
import {
  HEALTH_UNIT_TYPE_LABELS,
  getHealthUnits,
  type HealthUnit,
} from '@/services/healthApi';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const UNIT_IMAGES: Record<string, string> = {
  UBS: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&auto=format&fit=crop&q=60',
  UPA: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=200&auto=format&fit=crop&q=60',
  HOSPITAL: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&auto=format&fit=crop&q=60',
  CLINICA: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=200&auto=format&fit=crop&q=60',
  CAPS: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200&auto=format&fit=crop&q=60',
};

const FALLBACK_UNITS: HealthUnit[] = [
  {
    id: 'ubs-centro',
    name: 'UBS Centro de Maricá',
    type: 'UBS',
    address: 'Praça Cristiano Cruz, Centro, Maricá - RJ',
    neighborhood: 'Centro',
    phone: '(21) 2637-2050',
    latitude: -22.9194,
    longitude: -42.8186,
    openingHours: 'Seg–Sex 7h–17h',
    specialties: [],
    exams: [],
  },
  {
    id: 'ubs-itaipuacu',
    name: 'UBS Itaipuaçu',
    type: 'UBS',
    address: 'Av. Beira-Mar, Itaipuaçu, Maricá - RJ',
    neighborhood: 'Itaipuaçu',
    phone: '(21) 2634-1120',
    latitude: -22.9602,
    longitude: -42.9931,
    openingHours: 'Seg–Sex 7h–17h',
    specialties: [],
    exams: [],
  },
  {
    id: 'upa-centro',
    name: 'UPA 24h Maricá',
    type: 'UPA',
    address: 'Av. Roberto Silveira, Centro, Maricá - RJ',
    neighborhood: 'Centro',
    phone: '(21) 2637-4400',
    latitude: -22.9185,
    longitude: -42.8201,
    openingHours: '24 horas',
    specialties: [],
    exams: [],
  },
  {
    id: 'hospital-municipal',
    name: 'Hospital Municipal Conde Modesto Leal',
    type: 'HOSPITAL',
    address: 'Centro, Maricá - RJ',
    neighborhood: 'Centro',
    phone: '(21) 2637-2121',
    latitude: -22.9178,
    longitude: -42.8192,
    openingHours: '24 horas',
    specialties: [],
    exams: [],
  },
];

function addressLine(unit: HealthUnit): string {
  return [unit.address, unit.neighborhood].filter(Boolean).join(' · ') || 'Endereço não informado';
}

export interface HealthFacilitiesProps {
  onSelect?: (unit: HealthUnit) => void;
}

export default function HealthFacilities({ onSelect }: HealthFacilitiesProps) {
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getHealthUnits()
      .then((list) => {
        if (!active) return;
        setUnits(list.length > 0 ? list : FALLBACK_UNITS);
      })
      .catch(() => {
        if (active) setUnits(FALLBACK_UNITS);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unidades próximas</Text>
      <Text style={styles.subtitle}>Toque para ver telefone, endereço e mapa</Text>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : (
        <View style={styles.list}>
          {units.map((unit) => (
            <Pressable
              key={unit.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => onSelect?.(unit)}
              accessibilityRole="button"
              accessibilityLabel={`${unit.name}, ${HEALTH_UNIT_TYPE_LABELS[unit.type] ?? unit.type}`}
              accessibilityHint="Abre o perfil da unidade"
            >
              <Image
                source={{ uri: UNIT_IMAGES[unit.type] ?? UNIT_IMAGES.UBS }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.type}>{HEALTH_UNIT_TYPE_LABELS[unit.type] ?? unit.type}</Text>
                <Text style={styles.name} numberOfLines={2}>
                  {unit.name}
                </Text>
                <Text style={styles.address} numberOfLines={2}>
                  {addressLine(unit)}
                </Text>
                {unit.phone ? (
                  <Text style={styles.phone} numberOfLines={1}>
                    {unit.phone}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 0, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: AppColors.text.secondary },
  subtitle: { fontSize: 14, color: AppColors.text.tertiary },
  loading: { paddingVertical: 24, alignItems: 'center' },
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
  info: { flex: 1, minWidth: 0, gap: 4 },
  type: { fontSize: 11, fontWeight: '800', color: '#1D4ED8', textTransform: 'uppercase' },
  name: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  address: { fontSize: 13, color: AppColors.text.tertiary },
  phone: { fontSize: 13, fontWeight: '600', color: AppColors.text.secondary, marginTop: 2 },
});
