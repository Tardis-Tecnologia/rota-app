import GuiaPendingProviderDetail from '@/components/guia/GuiaPendingProviderDetail';
import ProviderProfile from '@/components/ProviderProfile';
import { getGuiaProfileById } from '@/services/guiaCatalog';
import {
  getGuiaProviderRegistrationById,
  listGuiaProviderRegistrations,
} from '@/services/guiaPendingProvidersStore';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuiaDetailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = String(params.id ?? '').trim();
  const [loading, setLoading] = useState(true);
  const [pendingRegistration, setPendingRegistration] =
    useState<Awaited<ReturnType<typeof getGuiaProviderRegistrationById>>>(null);
  const [profile, setProfile] = useState<ReturnType<typeof getGuiaProfileById>>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [registrations, stored] = await Promise.all([
          listGuiaProviderRegistrations(),
          getGuiaProviderRegistrationById(id),
        ]);
        if (cancelled) return;

        if (stored?.status === 'PENDING' && stored.ownerUserId === user?.id) {
          setPendingRegistration(stored);
          setProfile(null);
          return;
        }

        setPendingRegistration(null);
        setProfile(getGuiaProfileById(id, registrations, user?.id));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

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

  if (pendingRegistration) {
    return <GuiaPendingProviderDetail registration={pendingRegistration} />;
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={44} color="#94a3b8" />
        <Text style={styles.errorText}>Prestador ou empresa não encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProviderProfile data={profile} />
    </SafeAreaView>
  );
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
