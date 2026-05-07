import { AppColors } from '@/constants/theme';
import { distanceMeters, getNearbyPlaces, type NearbyPlace } from '@/services/placesService';
import {
  getNeighborhoodSummary,
  type NeighborhoodEvent,
  type NeighborhoodTraffic,
} from '@/services/trafficApi';
import { getCurrentWeather, type CurrentWeather } from '@/services/weatherApi';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const DEFAULT_CENTER = {
  latitude: -22.9189,
  longitude: -42.8186,
};

const REALTIME_REFRESH_DISTANCE_METERS = 300;

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

const allowedNearbyCategories = new Set<string>([
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

const nearbyCategoryLabel: Record<string, string> = {
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

function formatTrafficText(traffic: NeighborhoodTraffic): string {
  const currentSpeed = Number.isFinite(traffic.currentSpeed)
    ? `${Math.round(traffic.currentSpeed)} km/h`
    : null;
  const freeFlowSpeed = Number.isFinite(traffic.freeFlowSpeed)
    ? `${Math.round(traffic.freeFlowSpeed)} km/h livre`
    : null;

  return [traffic.status, currentSpeed, freeFlowSpeed].filter(Boolean).join(' • ');
}

function formatWeatherText(weather: CurrentWeather): string {
  const temp = Math.round(weather.temperature);
  const rainText = weather.precipitationProbability > 40 ? 'chance de chuva' : 'sem chuva';

  return `${temp}°C, ${rainText}`;
}

function formatEventText(event: NeighborhoodEvent | null): string {
  if (!event) return 'Sem eventos próximos';

  const [, month, day] = event.date.split('-');
  const dateText = day && month ? `${day}/${month}` : event.date;
  const timeText = event.time ? event.time.slice(0, 5) : '';
  const scheduleText = timeText ? `${dateText} às ${timeText}` : dateText;

  return `${event.name} • ${scheduleText}`;
}

function formatNearbyServiceText(places: NearbyPlace[], lat: number, lon: number): string {
  const candidates = places.filter((p) => allowedNearbyCategories.has(p.category));
  if (candidates.length === 0) {
    if (places.length > 0) {
      const p = places[0];
      const prettyType = nearbyCategoryLabel[p.category] ?? 'Local';
      const prettyName = p.name?.trim() ? p.name.trim() : 'perto de você';
      return `${prettyType}: ${prettyName}`;
    }

    return 'Nenhum serviço encontrado por perto';
  }

  const closest = candidates.reduce((best, cur) => {
    const dBest = distanceMeters([lon, lat], [best.longitude, best.latitude]);
    const dCur = distanceMeters([lon, lat], [cur.longitude, cur.latitude]);
    return dCur < dBest ? cur : best;
  });
  const prettyType = nearbyCategoryLabel[closest.category] ?? 'Serviço';
  const prettyName = closest.name?.trim() ? closest.name.trim() : 'perto de você';
  const meters = Math.round(distanceMeters([lon, lat], [closest.longitude, closest.latitude]));
  const suffix = Number.isFinite(meters) ? ` • a ~${meters}m` : '';

  return `${prettyType}: ${prettyName}${suffix}`;
}

async function getRealtimeCoordinates(): Promise<{ lat: number; lon: number }> {
  let lat = DEFAULT_CENTER.latitude;
  let lon = DEFAULT_CENTER.longitude;

  try {
    if (Platform.OS === 'web') {
      const geolocation = globalThis.navigator?.geolocation;
      if (!geolocation) return { lat, lon };

      await new Promise<void>((resolve) => {
        geolocation.getCurrentPosition(
          ({ coords }) => {
            lat = coords.latitude;
            lon = coords.longitude;
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
        );
      });

      return { lat, lon };
    }

    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { lat, lon };

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    lat = loc.coords.latitude;
    lon = loc.coords.longitude;
  } catch {
    return { lat, lon };
  }

  return { lat, lon };
}

export default function Realtime() {
  const [weatherText, setWeatherText] = React.useState<string>('A consultar clima…');
  const [trafficText, setTrafficText] = React.useState<string>('A consultar trânsito…');
  const [nearbyServiceText, setNearbyServiceText] = React.useState<string>('A procurar serviços…');
  const [eventText, setEventText] = React.useState<string>('A procurar eventos…');
  const lastLoadedCoordsRef = React.useRef<{ lat: number; lon: number } | null>(null);
  const requestSeqRef = React.useRef(0);

  React.useEffect(() => {
    let cancelled = false;
    let nativeSubscription: Location.LocationSubscription | null = null;
    let webWatchId: number | null = null;

    function shouldLoadCoords(lat: number, lon: number): boolean {
      const last = lastLoadedCoordsRef.current;
      if (!last) return true;

      const meters = distanceMeters([last.lon, last.lat], [lon, lat]);
      return !Number.isFinite(meters) || meters >= REALTIME_REFRESH_DISTANCE_METERS;
    }

    async function loadRealtimeData(lat: number, lon: number): Promise<void> {
      if (!shouldLoadCoords(lat, lon)) return;

      lastLoadedCoordsRef.current = { lat, lon };
      const requestSeq = ++requestSeqRef.current;

      try {
        await Promise.all([
          getCurrentWeather({ lat, lon })
            .then((weather) => {
              if (cancelled || requestSeq !== requestSeqRef.current) return;
              setWeatherText(formatWeatherText(weather));
            })
            .catch(() => {
              if (cancelled || requestSeq !== requestSeqRef.current) return;
              setWeatherText('Não foi possível carregar o clima agora');
            }),
          getNeighborhoodSummary({ lat, lon })
            .then((summary) => {
              if (cancelled || requestSeq !== requestSeqRef.current) return;

              setTrafficText(
                summary.traffic
                  ? formatTrafficText(summary.traffic)
                  : 'Não foi possível carregar o trânsito agora',
              );
              setEventText(
                summary.errors.events
                  ? 'Não foi possível carregar eventos agora'
                  : formatEventText(summary.events.event),
              );
            })
            .catch(() => {
              if (cancelled || requestSeq !== requestSeqRef.current) return;
              setTrafficText('Não foi possível carregar o trânsito agora');
              setEventText('Não foi possível carregar eventos agora');
            }),
          getNearbyPlaces({
            lat,
            lon,
            radius: 7000,
            limit: 40,
          })
            .then((places) => {
              if (cancelled || requestSeq !== requestSeqRef.current) return;
              setNearbyServiceText(formatNearbyServiceText(places, lat, lon));
            })
            .catch(() => {
              if (cancelled || requestSeq !== requestSeqRef.current) return;
              setNearbyServiceText('Não foi possível carregar serviços agora');
            }),
        ]);
      } catch {
        if (cancelled || requestSeq !== requestSeqRef.current) return;
        setWeatherText('Não foi possível carregar o clima agora');
        setTrafficText('Não foi possível carregar o trânsito agora');
        setNearbyServiceText('Não foi possível carregar serviços agora');
        setEventText('Não foi possível carregar eventos agora');
      }
    }

    async function startRealtimeLocationWatch(): Promise<void> {
      const initial = await getRealtimeCoordinates();
      if (cancelled) return;

      void loadRealtimeData(initial.lat, initial.lon);

      if (Platform.OS === 'web') {
        const geolocation = globalThis.navigator?.geolocation;
        if (!geolocation) return;

        webWatchId = geolocation.watchPosition(
          ({ coords }) => {
            void loadRealtimeData(coords.latitude, coords.longitude);
          },
          () => undefined,
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
        );
        return;
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      if (cancelled || perm.status !== 'granted') return;

      nativeSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: REALTIME_REFRESH_DISTANCE_METERS,
        },
        ({ coords }) => {
          void loadRealtimeData(coords.latitude, coords.longitude);
        },
      );
    }

    void startRealtimeLocationWatch();
    return () => {
      cancelled = true;
      nativeSubscription?.remove();
      if (webWatchId != null) {
        globalThis.navigator?.geolocation?.clearWatch(webWatchId);
      }
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
            value={weatherText}
            iconName="partly-sunny-outline"
            iconBg="rgba(2, 132, 199, 0.12)"
            iconColor={AppColors.palette.sky.base}
          />
          <RealtimeTile
            label="TRÂNSITO"
            value={trafficText}
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
            label="EVENTO PRÓXIMO"
            value={eventText}
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