import DirectionsMapView from '@/components/DirectionsMapView';
import { AppColors } from '@/constants/theme';
import { openExternalDirections } from '@/utils/openExternalMaps';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function parseCoord(value: string | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export default function WorkLocationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    destLat?: string;
    destLng?: string;
    title?: string;
    address?: string;
  }>();

  const destLat = parseCoord(params.destLat);
  const destLng = parseCoord(params.destLng);
  const title = String(params.title ?? '').trim() || 'Obra';
  const address = String(params.address ?? '').trim();

  const destination = useMemo(() => {
    if (destLat == null || destLng == null) return null;
    return { latitude: destLat, longitude: destLng, title };
  }, [destLat, destLng, title]);

  const mapRegion = useMemo(() => {
    if (!destination) return null;
    return {
      latitude: destination.latitude,
      longitude: destination.longitude,
      latitudeDelta: 0.014,
      longitudeDelta: 0.014,
    };
  }, [destination]);

  if (!destination || !mapRegion) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.errorText}>Localização inválida.</Text>
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
          <Text style={styles.webPlaceholderText}>Mapa disponível no app mobile</Text>
        </View>
      ) : (
        <DirectionsMapView
          localizacao={mapRegion}
          routeCoordinates={[]}
          destination={destination}
        />
      )}

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>
      </SafeAreaView>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={AppColors.gray[500]} />
            <Text style={styles.addressText}>{address}</Text>
          </View>
        ) : null}
        <Text style={styles.hint}>Localização exata da obra no mapa.</Text>
        <TouchableOpacity
          style={styles.externalBtn}
          onPress={() =>
            openExternalDirections(destination.latitude, destination.longitude, title)
          }
          activeOpacity={0.85}
        >
          <Ionicons name="open-outline" size={18} color={AppColors.text.secondary} />
          <Text style={styles.externalBtnText}>Abrir no app de mapas</Text>
        </TouchableOpacity>
      </View>
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
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.gray[600],
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0891b2',
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.gray[600],
    fontWeight: '500',
  },
  hint: {
    fontSize: 13,
    color: AppColors.gray[500],
    fontWeight: '500',
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
});
