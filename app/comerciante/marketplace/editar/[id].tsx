import MarketplaceProductForm, {
  type MarketplaceFormValues,
} from '@/components/marketplace/MarketplaceProductForm';
import { getMarketplaceListingById, updateMarketplaceListing } from '@/services/marketplaceApi';
import type { MarketplaceCategoryId, MarketplaceListingInput } from '@/types/marketplace';
import { formatPriceForInput } from '@/utils/marketplaceFormat';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

const KNOWN_CATEGORIES = new Set<string>([
  'eletronicos',
  'moveis',
  'veiculos',
  'moda',
  'casa',
  'esportes',
  'outros',
]);

export default function ComercianteMarketplaceEditScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = String(params.id ?? '').trim();

  const [initial, setInitial] = useState<Partial<MarketplaceFormValues> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!listingId) {
      setInitial(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const item = await getMarketplaceListingById(listingId);
      if (!item) {
        setInitial(null);
      } else if (!item.isOwner) {
        Alert.alert('Acesso negado', 'Você não pode editar este anúncio.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        setInitial(null);
      } else {
        const category = KNOWN_CATEGORIES.has(item.category)
          ? (item.category as MarketplaceCategoryId)
          : 'outros';
        const pickup = item.locationName.trim() !== 'A combinar';
        setInitial({
          title: item.title,
          description: item.description,
          category,
          priceText: formatPriceForInput(item.price),
          usePickupLocation: pickup,
          cep: '',
          locationName: pickup ? item.locationName : '',
          locationAddress: item.locationAddress ?? '',
          streetNumber: '',
          advertiserContact: item.advertiserContact,
          imageUri: item.imageUri,
          imageId: item.imageId,
        });
      }
    } catch {
      setInitial(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (input: MarketplaceListingInput) => {
    setSaving(true);
    try {
      await updateMarketplaceListing(listingId, input);
      router.replace({
        pathname: '/comerciante/marketplace/[id]',
        params: { id: listingId },
      });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!initial) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Anúncio indisponível para edição.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MarketplaceProductForm
        initial={initial}
        submitLabel="Salvar alterações"
        loading={saving}
        onSubmit={(values) => void onSubmit(values)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 15, fontWeight: '600', color: '#64748b' },
});
