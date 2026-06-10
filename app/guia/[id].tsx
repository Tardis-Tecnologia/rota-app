import GuiaMyProviderStatus from '@/components/guia/GuiaMyProviderStatus';
import GuiaPlaceDetail from '@/components/guia/GuiaPlaceDetail';
import ProviderProfile from '@/components/ProviderProfile';
import { getUserById } from '@/services/authApi';
import { getGuiaPlaceById } from '@/services/guiaPlacesCatalog';
import {
  getCachedServiceProvider,
  patchCachedServiceProvider,
  setCachedServiceProvider,
} from '@/services/guiaProviderDetailCache';
import { getServiceProviderById } from '@/services/serviceProvidersApi';
import { useAuth } from '@/contexts/AuthContext';
import { GUIA_PROVIDER_DETAIL_STALE_MS } from '@/utils/guiaReloadPolicy';
import { serviceProviderResponseToProfile } from '@/utils/serviceProviderMappers';
import type { ServiceProviderResponse } from '@/types/serviceProvider';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function needsOwnerPhoto(provider: ServiceProviderResponse): boolean {
  return !provider.imagePublicUrl?.trim();
}

export default function GuiaDetailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string; originLat?: string; originLng?: string }>();
  const id = String(params.id ?? '').trim();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ServiceProviderResponse | null>(null);
  const [providerOwnerPhotoUrl, setProviderOwnerPhotoUrl] = useState<string | null>(null);
  const [mapPlace, setMapPlace] = useState<ReturnType<typeof getGuiaPlaceById>>(null);
  const [notFound, setNotFound] = useState(false);
  const lastFetchedAtRef = useRef(0);

  const loadOwnerPhoto = useCallback(async (data: ServiceProviderResponse) => {
    if (!needsOwnerPhoto(data)) {
      setProviderOwnerPhotoUrl(null);
      return;
    }
    try {
      const owner = await getUserById(data.userId);
      setProviderOwnerPhotoUrl(owner.photoUrl ?? null);
    } catch {
      setProviderOwnerPhotoUrl(null);
    }
  }, []);

  const applyProvider = useCallback(
    (data: ServiceProviderResponse) => {
      setCachedServiceProvider(id, data);
      setProvider(data);
      lastFetchedAtRef.current = Date.now();
      void loadOwnerPhoto(data);
    },
    [id, loadOwnerPhoto],
  );

  const fetchProvider = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!id) {
        setLoading(false);
        setNotFound(true);
        return;
      }

      const cachedPlace = getGuiaPlaceById(id);
      if (cachedPlace) {
        setMapPlace(cachedPlace);
        setProvider(null);
        setNotFound(false);
        setLoading(false);
        return;
      }

      setMapPlace(null);
      if (!silent) {
        const cached = getCachedServiceProvider(id);
        if (cached) {
          setProvider(cached);
          setNotFound(false);
          setLoading(false);
          void loadOwnerPhoto(cached);
        } else {
          setLoading(true);
          setNotFound(false);
        }
      }

      try {
        const data = await getServiceProviderById(id);
        applyProvider(data);
        setNotFound(false);
      } catch {
        if (!silent && !getCachedServiceProvider(id)) {
          setNotFound(true);
          setProvider(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [applyProvider, id, loadOwnerPhoto],
  );

  useEffect(() => {
    setProvider(null);
    setProviderOwnerPhotoUrl(null);
    setMapPlace(null);
    setNotFound(false);
    void fetchProvider();
  }, [id, fetchProvider]);

  useFocusEffect(
    useCallback(() => {
      if (!id || getGuiaPlaceById(id)) return;
      const stale = Date.now() - lastFetchedAtRef.current >= GUIA_PROVIDER_DETAIL_STALE_MS;
      if (provider && !stale) return;
      void fetchProvider({ silent: !!provider });
    }, [fetchProvider, id, provider]),
  );

  const profileData = useMemo(() => {
    if (!provider) return null;
    const mapped = serviceProviderResponseToProfile(provider);
    if (providerOwnerPhotoUrl) mapped.image = providerOwnerPhotoUrl;
    return mapped;
  }, [provider, providerOwnerPhotoUrl]);

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Perfil inválido.</Text>
      </View>
    );
  }

  if (loading && !provider && !mapPlace) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const originLat = (() => {
    const n = Number.parseFloat(String(params.originLat ?? ''));
    return Number.isFinite(n) ? n : undefined;
  })();
  const originLng = (() => {
    const n = Number.parseFloat(String(params.originLng ?? ''));
    return Number.isFinite(n) ? n : undefined;
  })();

  if (mapPlace) {
    return (
      <GuiaPlaceDetail item={mapPlace} originLat={originLat} originLng={originLng} />
    );
  }

  if (provider) {
    const isOwner = provider.isOwner || provider.userId === user?.id;
    if (isOwner && provider.status !== 'APPROVED') {
      return <GuiaMyProviderStatus providerId={provider.id} initial={provider} />;
    }

    if ((provider.status === 'APPROVED' || isOwner) && profileData) {
      const canRate =
        !isOwner &&
        provider.status === 'APPROVED' &&
        !!user &&
        user.profile !== 'VISITANTE';

      return (
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ProviderProfile
            data={profileData!}
            canRate={canRate}
            providerId={provider.id}
            userRating={provider.userRating}
            onRatingUpdated={(payload) => {
              setProvider((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  ratingAverage: String(payload.ratingAverage),
                  ratingCount: payload.ratingCount,
                  userRating: payload.userRating,
                };
              });
              patchCachedServiceProvider(provider.id, {
                ratingAverage: String(payload.ratingAverage),
                ratingCount: payload.ratingCount,
                userRating: payload.userRating,
              });
            }}
          />
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={44} color="#94a3b8" />
        <Text style={styles.errorText}>Prestador não encontrado.</Text>
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={44} color="#94a3b8" />
        <Text style={styles.errorText}>Prestador ou empresa não encontrado.</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
});
