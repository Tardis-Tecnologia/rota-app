import { AppColors } from '@/constants/theme';
import { distanceMeters, getNearbyPlaces, type NearbyPlace } from '@/services/placesService';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const DEFAULT_CENTER = {
  latitude: -22.9189,
  longitude: -42.8186,
};

type RealtimeTileProps = {
  label: string;
  value: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
};

function RealtimeTile({ label, value, iconName, iconBg, iconColor }: RealtimeTileProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <View style={styles.tileTextCol}>
        <Text style={styles.tileLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.tileValue} numberOfLines={3}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function Realtime() {
  const [nearbyServiceText, setNearbyServiceText] = React.useState<string>('A procurar serviços…');

  React.useEffect(() => {
    let cancelled = false;

    async function loadNearbyService(): Promise<void> {
      if (Platform.OS === 'web') return;

      try {
        let lat = DEFAULT_CENTER.latitude;
        let lon = DEFAULT_CENTER.longitude;

        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }

        const allowed = new Set<string>([
          'hospital',
          'pharmacy',
          'atm',
          'bank',
          'market',
          'supermarket',
          'gas_station',
          'restaurant',
          'fast_food',
          'bakery',
          'cafe',
          'shopping_center',
          'shopping',
          'gym',
          'park',
          'school',
          'hotel',
        ]);
        const categoryLabel: Record<string, string> = {
          hospital: 'Hospital',
          pharmacy: 'Farmácia',
          atm: 'Caixa',
          bank: 'Banco',
          market: 'Mercado',
          supermarket: 'Supermercado',
          gas_station: 'Posto',
          restaurant: 'Restaurante',
          fast_food: 'Fast-food',
          bakery: 'Padaria',
          cafe: 'Café',
          shopping_center: 'Shopping',
          shopping: 'Shopping',
          gym: 'Academia',
          park: 'Parque',
          school: 'Escola',
          hotel: 'Hotel',
        };

        const places = await getNearbyPlaces({
          lat,
          lon,
          radius: 7000,
          limit: 40,
        });

        const candidates = places.filter((p) => allowed.has(p.category));
        if (candidates.length === 0) {
          if (cancelled) return;
          if (places.length > 0) {
            const p = places[0];
            const prettyType = categoryLabel[p.category] ?? 'Local';
            const prettyName = p.name?.trim() ? p.name.trim() : 'perto de você';
            setNearbyServiceText(`${prettyType}: ${prettyName}`);
            return;
          }
          setNearbyServiceText('Nenhum serviço encontrado por perto');
          return;
        }

        const pickClosest = (items: NearbyPlace[]): NearbyPlace => {
          return items.reduce((best, cur) => {
            const dBest = distanceMeters([lon, lat], [best.longitude, best.latitude]);
            const dCur = distanceMeters([lon, lat], [cur.longitude, cur.latitude]);
            return dCur < dBest ? cur : best;
          });
        };

        const closest = pickClosest(candidates);
        const prettyType = categoryLabel[closest.category] ?? 'Serviço';
        const prettyName = closest.name?.trim() ? closest.name.trim() : 'perto de você';
        const meters = Math.round(distanceMeters([lon, lat], [closest.longitude, closest.latitude]));
        const suffix = Number.isFinite(meters) ? ` • a ~${meters}m` : '';

        if (cancelled) return;
        setNearbyServiceText(`${prettyType}: ${prettyName}${suffix}`);
      } catch {
        if (cancelled) return;
        setNearbyServiceText('Não foi possível carregar serviços agora');
      }
    }

    void loadNearbyService();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>Agora no seu bairro</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>TEMPO REAL</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Resumo rápido do que muda aí perto, em tempo quase real.
          </Text>
        </View>

        <View style={styles.grid}>
          <RealtimeTile
            label="CLIMA"
            value="27°C, chance de chuva"
            iconName="partly-sunny-outline"
            iconBg="rgba(2, 132, 199, 0.12)"
            iconColor={AppColors.palette.sky.base}
          />
          <RealtimeTile
            label="TRÂNSITO"
            value="Fluxo moderado"
            iconName="car-outline"
            iconBg="rgba(99, 102, 241, 0.12)"
            iconColor={AppColors.palette.indigo.base}
          />
          <RealtimeTile
            label="SERVIÇO PRÓXIMO"
            value={nearbyServiceText}
            iconName="medkit-outline"
            iconBg="rgba(231, 76, 60, 0.10)"
            iconColor={AppColors.status.error}
          />
          <RealtimeTile
            label="EVENTO HOJE"
            value="Feira local às 18h"
            iconName="calendar-outline"
            iconBg="rgba(245, 158, 11, 0.14)"
            iconColor={AppColors.status.warning}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  card: {
    backgroundColor: AppColors.background.glass,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },
  pill: {
    backgroundColor: 'rgba(34, 211, 238, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: AppColors.primaryLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    flexBasis: '48%',
    maxWidth: '48%',
    minHeight: 86,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 10,
  },
  tileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  tileTextCol: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
    color: AppColors.text.quaternary,
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.text.secondary,
    lineHeight: 17,
  },
});