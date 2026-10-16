import ExploreMapControls from '@/components/ExploreMapControls';
import MapLibreMapaView, { type MapLibreMapaViewRef } from '@/components/MapLibreMapaView';
import { AppColors } from '@/constants/theme';
import { setCommunityLocationPick } from '@/services/forumCommunityLocationPick';
import type { Localizacao, Region } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWhitelabelCity, useWhitelabelMapCenter } from '@/hooks/useWhitelabelCity';

const MARKER_COLOR = '#0891b2';
const FOOTER_HEIGHT = 88;

function parseCoord(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function regionFromCenter(lat: number, lng: number, delta = 0.012): Localizacao {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export default function CommunityPickLocationScreen() {
  const insets = useSafeAreaInsets();
  const city = useWhitelabelCity();
  const cityMapCenter = useWhitelabelMapCenter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const mapRef = useRef<MapLibreMapaViewRef | null>(null);

  const initialLat = parseCoord(params.lat);
  const initialLng = parseCoord(params.lng);

  const [mapCenter, setMapCenter] = useState<Localizacao>(() => {
    if (initialLat != null && initialLng != null) {
      return regionFromCenter(initialLat, initialLng);
    }
    return regionFromCenter(cityMapCenter.latitude, cityMapCenter.longitude);
  });
  const [booting, setBooting] = useState(initialLat == null || initialLng == null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (initialLat != null && initialLng != null) {
      setBooting(false);
      return;
    }

    if (city.fixedMapCenter) {
      const next = regionFromCenter(city.latitude, city.longitude);
      setMapCenter(next);
      mapRef.current?.animateToRegion(next, 400);
      setBooting(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setBooting(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const next = regionFromCenter(pos.coords.latitude, pos.coords.longitude);
        setMapCenter(next);
        mapRef.current?.animateToRegion(next, 400);
      } catch {
        const next = regionFromCenter(city.latitude, city.longitude);
        setMapCenter(next);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [city.fixedMapCenter, city.latitude, city.longitude, initialLat, initialLng]);

  const localizacao = useMemo(() => mapCenter, [mapCenter]);

  const handleRegionChange = useCallback((region: Region) => {
    setMapCenter((prev) => ({
      ...prev,
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    }));
  }, []);

  const handleCenterUser = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Localização', 'Permita o acesso à localização para centralizar o mapa.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = regionFromCenter(pos.coords.latitude, pos.coords.longitude);
      setMapCenter(next);
      mapRef.current?.animateToRegion(next, 450);
    } catch {
      Alert.alert('Mapa', 'Não foi possível obter sua localização.');
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomBy(1, 280);
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomBy(-1, 280);
  }, []);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    const latitude = mapCenter.latitude;
    const longitude = mapCenter.longitude;

    let locationName: string | undefined;
    let locationAddress: string | undefined;

    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      const p = places[0];
      if (p) {
        const addr = [p.street, p.name, p.district, p.city, p.region]
          .filter(Boolean)
          .join(', ');
        if (addr.trim()) locationAddress = addr.trim();
        const name = p.name?.trim() || p.street?.trim() || p.district?.trim();
        if (name) locationName = name;
      }
    } catch {
      /* coordenadas ainda são salvas */
    }

    setCommunityLocationPick({
      latitude,
      longitude,
      locationName,
      locationAddress,
    });
    setConfirming(false);
    router.back();
  }, [mapCenter.latitude, mapCenter.longitude]);

  const mapControlsBottom = FOOTER_HEIGHT + insets.bottom + 16;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Ionicons name="map-outline" size={40} color={AppColors.primary} />
        <Text style={styles.webTitle}>Mapa no aplicativo</Text>
        <Text style={styles.webHint}>
          Abra no celular para marcar o ponto da comunidade no mapa.
        </Text>
        <Pressable style={styles.webBackBtn} onPress={() => router.back()}>
          <Text style={styles.webBackBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapLibreMapaView
        ref={mapRef}
        localizacao={localizacao}
        pontos={[]}
        getMarkerColor={() => MARKER_COLOR}
        onRegionChangeComplete={handleRegionChange}
      />

      <View pointerEvents="none" style={styles.pinLayer}>
        <View style={styles.pinWrap}>
          <Ionicons name="location" size={44} color={MARKER_COLOR} />
          <View style={styles.pinShadow} />
        </View>
      </View>

      {booting ? (
        <View style={[styles.bootOverlay, { paddingTop: insets.top + 12 }]}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.bootText}>Centralizando no mapa…</Text>
        </View>
      ) : (
        <View
          pointerEvents="none"
          style={[styles.hintWrap, { top: insets.top + 8 }]}
          accessibilityElementsHidden
        >
          <View style={styles.hintPill}>
            <Ionicons name="move-outline" size={16} color="#0e7490" />
            <Text style={styles.hintText}>Arraste o mapa para marcar o ponto</Text>
          </View>
        </View>
      )}

      <ExploreMapControls
        bottomOffset={mapControlsBottom}
        onCenterUser={() => void handleCenterUser()}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
          onPress={() => router.back()}
          disabled={confirming}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && styles.btnPressed,
            confirming && styles.confirmBtnDisabled,
          ]}
          onPress={() => void handleConfirm()}
          disabled={confirming}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirmar local</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: AppColors.background.default,
  },
  webTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  webHint: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  webBackBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  webBackBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  pinLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  pinWrap: {
    alignItems: 'center',
    marginBottom: 22,
  },
  pinShadow: {
    width: 12,
    height: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: -6,
  },
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0e7490',
  },
  bootOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 11,
  },
  bootText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    zIndex: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.light,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
  },
  confirmBtnDisabled: {
    opacity: 0.75,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  btnPressed: {
    opacity: 0.88,
  },
});
