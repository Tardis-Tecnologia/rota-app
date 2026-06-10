import DirectionsMapView from '@/components/DirectionsMapView';
import { AppColors } from '@/constants/theme';
import {
  formatRouteDistance,
  formatRouteDuration,
  getDirectionsRoute,
  ROUTING_TIMEOUT_ERROR,
} from '@/services/directionsService';
import {
  ensureForegroundLocationPermission,
  getCurrentPositionWithRetry,
  LOCATION_TIMEOUT_ERROR,
} from '@/services/locationPermission';
import type { DirectionsProfile } from '@/types/directions';
import { distanceMeters } from '@/utils/guiaGeo';
import { openExternalDirections } from '@/utils/openExternalMaps';
import { regionFromRouteCoordinates } from '@/utils/routeBounds';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_ROUTE_DISTANCE_METERS = 2_000_000;
const ORIGIN_GPS_TIMEOUT_MS = 12_000;

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function parseCoord(value: string | string[] | undefined): number | null {
  const raw = normalizeParam(value);
  if (raw == null || raw === '') return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

async function resolveOriginCoords(
  originLatParam: string | string[] | undefined,
  originLngParam: string | string[] | undefined,
): Promise<{ latitude: number; longitude: number } | null> {
  let fromLat = parseCoord(originLatParam);
  let fromLng = parseCoord(originLngParam);
  if (fromLat != null && fromLng != null) {
    return { latitude: fromLat, longitude: fromLng };
  }

  const ok = await ensureForegroundLocationPermission();
  if (!ok) return null;

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) {
    return {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
    };
  }

  const pos = await getCurrentPositionWithRetry(
    { accuracy: Location.Accuracy.Balanced },
    1,
    800,
    ORIGIN_GPS_TIMEOUT_MS,
  );
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

export default function DirectionsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    destLat?: string | string[];
    destLng?: string | string[];
    destName?: string | string[];
    originLat?: string | string[];
    originLng?: string | string[];
    profile?: string | string[];
  }>();

  const destLat = parseCoord(params.destLat);
  const destLng = parseCoord(params.destLng);
  const destName = String(normalizeParam(params.destName) ?? '').trim() || 'Destino';
  const profileParam = normalizeParam(params.profile);
  const profile: DirectionsProfile = profileParam === 'walking' ? 'walking' : 'driving';
  const originLatParam = normalizeParam(params.originLat);
  const originLngParam = normalizeParam(params.originLng);

  const [routeLoading, setRouteLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeWarning, setRouteWarning] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [route, setRoute] = useState<Awaited<ReturnType<typeof getDirectionsRoute>> | null>(null);
  const loadSeqRef = useRef(0);

  const destination = useMemo(() => {
    if (destLat == null || destLng == null) return null;
    return { latitude: destLat, longitude: destLng, title: destName };
  }, [destLat, destLng, destName]);

  const loadRoute = useCallback(async () => {
    if (!destination) {
      setError('Destino inválido.');
      setRouteLoading(false);
      return;
    }

    const seq = ++loadSeqRef.current;
    setRouteLoading(true);
    setError(null);
    setRouteWarning(null);

    try {
      const originPoint = await resolveOriginCoords(originLatParam, originLngParam);
      if (seq !== loadSeqRef.current) return;

      if (!originPoint) {
        setOrigin(null);
        setRoute(null);
        setRouteWarning(
          'Permita a localização para traçar a rota. O destino está marcado no mapa.',
        );
        return;
      }

      setOrigin(originPoint);

      const distToDest = distanceMeters(
        originPoint.latitude,
        originPoint.longitude,
        destination.latitude,
        destination.longitude,
      );
      if (distToDest > MAX_ROUTE_DISTANCE_METERS) {
        setRoute(null);
        setRouteWarning(
          'Sua localização atual está muito longe do destino. O endereço está marcado no mapa — ajuste a localização do simulador para o Brasil para testar a rota completa.',
        );
        return;
      }

      const result = await getDirectionsRoute(
        [originPoint.longitude, originPoint.latitude],
        [destination.longitude, destination.latitude],
        profile,
      );
      if (seq !== loadSeqRef.current) return;
      setRoute(result);
    } catch (err) {
      if (seq !== loadSeqRef.current) return;
      setRoute(null);
      const isTimeout =
        err instanceof Error &&
        (err.message === ROUTING_TIMEOUT_ERROR || err.message === LOCATION_TIMEOUT_ERROR);
      setRouteWarning(
        isTimeout
          ? 'O serviço de rotas demorou para responder. O destino está marcado no mapa — tente novamente ou abra no app de mapas.'
          : 'Não foi possível traçar a rota da sua posição atual. O endereço de destino está marcado no mapa.',
      );
    } finally {
      if (seq === loadSeqRef.current) {
        setRouteLoading(false);
      }
    }
  }, [destination, originLatParam, originLngParam, profile]);

  useEffect(() => {
    void loadRoute();
  }, [loadRoute]);

  const mapRegion = useMemo(() => {
    if (route?.coordinates.length) {
      return regionFromRouteCoordinates(route.coordinates);
    }
    if (destination) {
      return {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [route, destination]);

  if (!destination) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.errorText}>Destino inválido.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.webPlaceholder}>
          <Ionicons name="map-outline" size={40} color={AppColors.gray[400]} />
          <Text style={styles.webPlaceholderText}>Rota disponível no app mobile</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredMap}>
          <Ionicons name="navigate-outline" size={44} color={AppColors.gray[400]} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void loadRoute()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <DirectionsMapView
          localizacao={mapRegion}
          routeCoordinates={route?.coordinates ?? []}
          destination={destination}
          origin={origin}
        />
      )}

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>
      </SafeAreaView>

      {Platform.OS !== 'web' && !error ? (
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.destTitle} numberOfLines={2}>
            {destName}
          </Text>
          {routeLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text style={styles.loadingText}>Calculando rota…</Text>
            </View>
          ) : route ? (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color="#6d28d9" />
                <Text style={styles.metaValue}>{formatRouteDuration(route.durationSeconds)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={18} color="#6d28d9" />
                <Text style={styles.metaValue}>{formatRouteDistance(route.distanceMeters)}</Text>
              </View>
            </View>
          ) : routeWarning ? (
            <Text style={styles.warningText}>{routeWarning}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.externalBtn}
            onPress={() =>
              openExternalDirections(destination.latitude, destination.longitude, destName)
            }
            activeOpacity={0.85}
          >
            <Ionicons name="open-outline" size={18} color={AppColors.text.secondary} />
            <Text style={styles.externalBtnText}>Abrir no app de mapas</Text>
          </TouchableOpacity>
          {!routeLoading && routeWarning ? (
            <TouchableOpacity onPress={() => void loadRoute()} style={styles.retryLink} activeOpacity={0.85}>
              <Text style={styles.retryLinkText}>Tentar calcular rota novamente</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.gray[200] },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  centeredMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: AppColors.gray[100],
  },
  webPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.gray[200],
  },
  webPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.gray[500],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.gray[600],
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.gray[600],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  destTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4c1d95',
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    backgroundColor: AppColors.gray[100],
    marginTop: 4,
  },
  externalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.gray[600],
    fontWeight: '500',
  },
  retryLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  retryLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
