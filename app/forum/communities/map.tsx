import CommunityMapLocationCard from '@/components/forum/CommunityMapLocationCard';
import ExploreMapControls from '@/components/ExploreMapControls';
import MapLibreMapaView, { type MapLibreMapaViewRef } from '@/components/MapLibreMapaView';
import { AppColors } from '@/constants/theme';
import {
  communityCoverUrl,
  getForumCommunity,
  parseCommunityCoords,
  type ForumCommunityDetail,
} from '@/services/forumCommunityApi';
import { useWhitelabelMapCenter } from '@/hooks/useWhitelabelCity';
import type { Localizacao, PontoInteresse } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COMMUNITY_MARKER_COLOR = '#0891b2';
const CARD_ESTIMATED_HEIGHT = 156;

function communityToPonto(
  community: ForumCommunityDetail,
  lat: number,
  lng: number,
): PontoInteresse {
  const cover = communityCoverUrl(community);
  return {
    id: `community-${community.id}`,
    titulo: community.name,
    descricao:
      community.locationName?.trim() ||
      community.locationAddress?.trim() ||
      'Canal da comunidade',
    latitude: lat,
    longitude: lng,
    tipo: 'cultura',
    photoUrl: cover ?? undefined,
    formattedAddress: community.locationAddress?.trim() || undefined,
    placeType: 'community',
  };
}

export default function CommunityMapScreen() {
  const cityMapCenter = useWhitelabelMapCenter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const communityId = String(params.id ?? '').trim();
  const mapRef = useRef<MapLibreMapaViewRef | null>(null);

  const [community, setCommunity] = useState<ForumCommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageEpoch] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!communityId) {
        setError('Comunidade inválida.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const detail = await getForumCommunity(communityId);
        if (cancelled) return;
        if (!parseCommunityCoords(detail)) {
          setError('Esta comunidade não tem localização cadastrada.');
          setCommunity(null);
        } else {
          setCommunity(detail);
        }
      } catch (e) {
        if (!cancelled) {
          setCommunity(null);
          setError(e instanceof Error ? e.message : 'Não foi possível carregar o mapa.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const coords = community ? parseCommunityCoords(community) : null;

  const localizacao: Localizacao = useMemo(() => {
    if (!coords) {
      return { ...cityMapCenter };
    }
    return {
      latitude: coords.lat,
      longitude: coords.lng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }, [cityMapCenter, coords]);

  const pontos: PontoInteresse[] = useMemo(() => {
    if (!community || !coords) return [];
    return [communityToPonto(community, coords.lat, coords.lng)];
  }, [community, coords]);

  const handleCenterCommunity = useCallback(() => {
    mapRef.current?.animateToRegion(localizacao, 450);
  }, [localizacao]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomBy(1, 280);
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomBy(-1, 280);
  }, []);

  const getMarkerColor = useCallback(() => COMMUNITY_MARKER_COLOR, []);

  const mapControlsBottom = CARD_ESTIMATED_HEIGHT + insets.bottom + 24;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Ionicons name="map-outline" size={40} color={AppColors.primary} />
        <Text style={styles.webTitle}>Mapa no app</Text>
        <Text style={styles.webHint}>
          Abra no celular para ver o ponto do canal no mapa interativo.
        </Text>
        {community && coords ? (
          <Text style={styles.webCoords}>
            {community.name} — {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </Text>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  if (error || !community || !coords) {
    return (
      <View style={styles.center}>
        <Ionicons name="location-outline" size={40} color={AppColors.text.quaternary} />
        <Text style={styles.errorText}>{error ?? 'Localização indisponível.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapLibreMapaView
        ref={mapRef}
        localizacao={localizacao}
        pontos={pontos}
        getMarkerColor={getMarkerColor}
        onMarkerPress={() => {}}
      />

      <View
        pointerEvents="none"
        style={[styles.mapHint, { top: insets.top + 8 }]}
        accessibilityElementsHidden
      >
        <View style={styles.mapHintPill}>
          <Ionicons name="people" size={16} color="#0e7490" />
          <Text style={styles.mapHintText}>Ponto do canal no mapa</Text>
        </View>
      </View>

      <ExploreMapControls
        bottomOffset={mapControlsBottom}
        onCenterUser={handleCenterCommunity}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <CommunityMapLocationCard
        community={community}
        imageEpoch={imageEpoch}
        style={{ bottom: insets.bottom + 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background.default },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: AppColors.background.default,
  },
  loadingText: { color: AppColors.text.tertiary, fontWeight: '600' },
  errorText: {
    color: AppColors.text.tertiary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  webTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text.secondary },
  webHint: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  webCoords: { fontSize: 13, color: '#0e7490', fontWeight: '700', marginTop: 8 },
  mapHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  mapHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  mapHintText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0e7490',
  },
});
