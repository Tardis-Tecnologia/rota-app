import MarketplaceProductForm from '@/components/marketplace/MarketplaceProductForm';
import { useAuth } from '@/contexts/AuthContext';
import { createMarketplaceListing } from '@/services/marketplaceApi';
import type { MarketplaceListingInput } from '@/types/marketplace';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function ComercianteMarketplacePublishScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (input: MarketplaceListingInput) => {
    if (!user) {
      Alert.alert('Sessão expirada', 'Faça login novamente para publicar um anúncio.');
      return;
    }
    setLoading(true);
    try {
      const created = await createMarketplaceListing(input);
      // Não zerar loading após replace: setState no unmount causa crash Fabric
      // (addViewAt / child already has a parent).
      router.replace({
        pathname: '/comerciante/marketplace/[id]',
        params: { id: created.id },
      });
    } catch (e) {
      setLoading(false);
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível publicar o anúncio.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <MarketplaceProductForm
        submitLabel="Publicar anúncio"
        loading={loading}
        onSubmit={(values) => void onSubmit(values)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
});
