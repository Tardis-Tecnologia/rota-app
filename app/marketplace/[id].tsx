import MarketplaceProductImageGallery from '@/components/marketplace/MarketplaceProductImageGallery';
import { getMarketplaceCategoryMeta } from '@/constants/marketplaceCategories';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMarketplaceListingById,
} from '@/services/marketplaceApi';
import { prepareMarketplaceSellerChat } from '@/services/marketplaceSellerChat';
import type { MarketplaceListing } from '@/types/marketplace';
import { formatMarketplacePrice } from '@/utils/marketplaceFormat';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MarketplaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = String(params.id ?? '').trim();

  const [item, setItem] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const load = useCallback(async () => {
    if (!listingId) {
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getMarketplaceListingById(listingId);
      setItem(data);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openSellerChat = useCallback(async () => {
    if (!item) return;
    if (!user?.id) {
      Alert.alert('Login necessário', 'Faça login para enviar mensagem à loja.');
      return;
    }
    if (user.profile === 'VISITANTE') {
      promptVisitanteLogin('enviar mensagem à loja');
      return;
    }
    if (!item.sellerId?.trim()) {
      Alert.alert('Indisponível', 'Não foi possível identificar a loja deste anúncio.');
      return;
    }

    setChatLoading(true);
    try {
      const payload = await prepareMarketplaceSellerChat({
        buyerUserId: user.id,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerImage: item.sellerPhotoUrl,
        sellerIsCommercial: item.sellerIsCommercial,
        listingTitle: item.title,
        formattedPrice: formatMarketplacePrice(item.price),
        buyerDisplayName: user.name,
      });
      router.push({
        pathname: '/ChatTab',
        params: {
          provider: JSON.stringify(payload),
        },
      });
    } catch (e) {
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível abrir a conversa.',
      );
    } finally {
      setChatLoading(false);
    }
  }, [item, user?.id, user?.name, user?.profile]);

  const openCompanyProfile = () => {
    if (!item?.sellerId?.trim()) return;
    const seller = item;
    if (seller.sellerIsCommercial === false) {
      router.push({
        pathname: '/forum/author',
        params: {
          userId: seller.sellerId,
          name: seller.sellerName,
          photoUrl: seller.sellerPhotoUrl ?? '',
        },
      });
      return;
    }
    router.push({
      pathname: '/forum/store',
      params: {
        commercialId: seller.sellerId,
        storeName: seller.sellerName,
        photoUrl: seller.sellerPhotoUrl ?? '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Produto não encontrado.</Text>
      </View>
    );
  }

  const cat = getMarketplaceCategoryMeta(item.category);
  const locationLine = [item.locationName, item.locationAddress].filter(Boolean).join(' · ');
  const canContactStore = !!item.sellerId?.trim();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <MarketplaceProductImageGallery
          imageUris={
            item.imageUris?.length
              ? item.imageUris
              : item.imageUri
                ? [item.imageUri]
                : []
          }
        />

        <View style={styles.body}>
          <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon} size={14} color={cat.color} />
            <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.price}>{formatMarketplacePrice(item.price)}</Text>

          {locationLine ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={AppColors.text.tertiary} />
              <Text style={styles.location}>{locationLine}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Descrição</Text>
          <Text style={styles.description}>{item.description}</Text>

          <Text style={styles.sectionLabel}>Loja</Text>
          <Pressable
            style={({ pressed }) => [styles.sellerRow, pressed && styles.btnPressed]}
            onPress={openCompanyProfile}
            disabled={!canContactStore}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${item.sellerName}`}
          >
            {item.sellerPhotoUrl ? (
              <Image source={{ uri: item.sellerPhotoUrl }} style={styles.sellerPhoto} />
            ) : (
              <View style={styles.sellerFallback}>
                <Text style={styles.sellerFallbackText}>
                  {item.sellerName.trim().charAt(0).toUpperCase() || 'L'}
                </Text>
              </View>
            )}
            <View style={styles.sellerTextWrap}>
              <Text style={styles.sellerName}>{item.sellerName}</Text>
              {canContactStore ? (
                <Text style={styles.sellerHint}>Ver perfil da empresa</Text>
              ) : null}
            </View>
            {canContactStore ? (
              <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
            ) : null}
          </Pressable>

          {canContactStore && !item.isOwner ? (
            <Pressable
              style={({ pressed }) => [styles.contactBtn, pressed && styles.btnPressed]}
              onPress={() => void openSellerChat()}
              disabled={chatLoading}
              accessibilityRole="button"
              accessibilityLabel={`Falar com ${item.sellerName}`}
            >
              {chatLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                  <Text style={styles.contactBtnText}>Falar com a loja</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background.default },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, fontWeight: '600', color: AppColors.text.tertiary },
  hero: { width: '100%', height: 280, backgroundColor: AppColors.gray[200] },
  heroPlaceholder: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20, gap: 10 },
  catBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  catText: { fontSize: 12, fontWeight: '700' },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: AppColors.text.secondary,
    lineHeight: 32,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  location: { fontSize: 15, fontWeight: '600', color: AppColors.text.tertiary },
  sectionLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.text.quaternary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  sellerTextWrap: { flex: 1, gap: 2 },
  sellerHint: { fontSize: 13, fontWeight: '600', color: '#0d9488' },
  sellerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.gray[200],
  },
  sellerFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6d28d9',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.text.tertiary,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  btnPressed: { opacity: 0.9 },
  contactBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
