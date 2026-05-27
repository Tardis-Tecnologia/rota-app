import GuiaMyProviderStatus from '@/components/guia/GuiaMyProviderStatus';
import GuiaPlaceDetail from '@/components/guia/GuiaPlaceDetail';
import ProviderProfile from '@/components/ProviderProfile';
import { getGuiaPlaceById } from '@/services/guiaPlacesCatalog';
import { getServiceProviderById } from '@/services/serviceProvidersApi';
import { useAuth } from '@/contexts/AuthContext';
import { serviceProviderResponseToProfile } from '@/utils/serviceProviderMappers';
import type { ServiceProviderResponse } from '@/types/serviceProvider';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuiaDetailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = String(params.id ?? '').trim();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ServiceProviderResponse | null>(null);
  const [mapPlace, setMapPlace] = useState<ReturnType<typeof getGuiaPlaceById>>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setProvider(null);
    setMapPlace(null);

    const cachedPlace = getGuiaPlaceById(id);
    if (cachedPlace) {
      setMapPlace(cachedPlace);
      setLoading(false);
      return;
    }

    try {
      const data = await getServiceProviderById(id);
      setProvider(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Perfil inválido.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (mapPlace) {
    return <GuiaPlaceDetail item={mapPlace} />;
  }

  if (provider) {
    const isOwner = provider.isOwner || provider.userId === user?.id;
    if (isOwner && provider.status !== 'APPROVED') {
      return <GuiaMyProviderStatus providerId={provider.id} initial={provider} />;
    }

    if (provider.status === 'APPROVED' || isOwner) {
      return (
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ProviderProfile data={serviceProviderResponseToProfile(provider)} />
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
