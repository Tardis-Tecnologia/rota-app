import { getMarketplaceCategoryMeta } from '@/constants/marketplaceCategories';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  deleteMarketplaceListing,
  getMarketplaceListingById,
} from '@/services/marketplaceApi';
import { prepareMarketplaceSellerChat } from '@/services/marketplaceSellerChat';
import type { MarketplaceListing } from '@/types/marketplace';
import { formatMarketplacePrice } from '@/utils/marketplaceFormat';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function contactDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export default function MarketplaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = String(params.id ?? '').trim();

  const [item, setItem] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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
      Alert.alert('Login necessário', 'Faça login para enviar mensagem ao vendedor.');
      return;
    }
    if (user.profile === 'VISITANTE') {
      Alert.alert('Conta necessária', 'Visitantes não podem enviar mensagens. Faça login com uma conta cadastrada.');
      return;
    }
    if (!item.sellerId?.trim()) {
      Alert.alert('Indisponível', 'Não foi possível identificar o vendedor deste anúncio.');
      return;
    }
    if (item.sellerId === user.id) return;

    setChatLoading(true);
    try {
      const payload = await prepareMarketplaceSellerChat({
        buyerUserId: user.id,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        listingTitle: item.title,
        formattedPrice: formatMarketplacePrice(item.price),
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
  }, [item, user?.id, user?.profile]);

  const callPhone = () => {
    if (!item?.advertiserContact) return;
    void Linking.openURL(`tel:${contactDigits(item.advertiserContact)}`);
  };

  const onDelete = () => {
    if (!item) return;
    Alert.alert('Excluir anúncio', 'Tem certeza que deseja excluir este produto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setDeleting(true);
          void deleteMarketplaceListing(item.id)
            .then(() => {
              router.back();
            })
            .catch((e) => {
              Alert.alert(
                'Erro',
                e instanceof Error ? e.message : 'Não foi possível excluir.',
              );
            })
            .finally(() => setDeleting(false));
        },
      },
    ]);
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
  const canMessageSeller = !item.isOwner && !!item.sellerId?.trim();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.hero} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.heroPlaceholder}>
            <Ionicons name="cube-outline" size={48} color="#fff" />
          </LinearGradient>
        )}

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

          <Text style={styles.sectionLabel}>Anunciante</Text>
          <Text style={styles.sellerName}>{item.sellerName}</Text>

          {canMessageSeller ? (
            <>
              <Text style={styles.sectionLabel}>Contato</Text>
              <Pressable
                style={styles.contactRow}
                onPress={() => void openSellerChat()}
                disabled={chatLoading}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#7c3aed" />
                <View style={styles.contactTextWrap}>
                  <Text style={styles.contactText}>Enviar mensagem no app</Text>
                  <Text style={styles.contactHint} numberOfLines={2}>
                    Abre um chat com {item.sellerName} e uma mensagem pronta sobre este produto.
                  </Text>
                </View>
                {chatLoading ? (
                  <ActivityIndicator size="small" color="#7c3aed" />
                ) : (
                  <Text style={styles.contactAction}>Abrir</Text>
                )}
              </Pressable>
              {item.advertiserContact ? (
                <Pressable style={styles.contactRowSecondary} onPress={callPhone}>
                  <Ionicons name="call-outline" size={18} color={AppColors.text.tertiary} />
                  <Text style={styles.contactSecondaryText}>Ligar: {item.advertiserContact}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {item.isOwner ? (
            <View style={styles.ownerActions}>
              <Pressable
                style={styles.editBtn}
                onPress={() =>
                  router.push({
                    pathname: '/marketplace/editar/[id]',
                    params: { id: item.id },
                  })
                }
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editBtnText}>Editar anúncio</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
                onPress={onDelete}
                disabled={deleting}
              >
                <Ionicons name="trash-outline" size={20} color={AppColors.status.error} />
                <Text style={styles.deleteBtnText}>
                  {deleting ? 'Excluindo...' : 'Excluir anúncio'}
                </Text>
              </Pressable>
            </View>
          ) : canMessageSeller ? (
            <Pressable
              style={styles.ctaBtn}
              onPress={() => void openSellerChat()}
              disabled={chatLoading}
            >
              <LinearGradient
                colors={['#7c3aed', '#db2777']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.ctaGradient}
              >
                {chatLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                    <Text style={styles.ctaText}>Enviar mensagem ao vendedor</Text>
                  </>
                )}
              </LinearGradient>
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff',
    marginTop: 6,
  },
  contactTextWrap: { flex: 1, gap: 4 },
  contactText: { fontSize: 15, fontWeight: '700', color: AppColors.text.secondary },
  contactHint: { fontSize: 12, lineHeight: 17, color: AppColors.text.tertiary },
  contactAction: { fontSize: 13, fontWeight: '800', color: '#7c3aed' },
  contactRowSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  contactSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  ownerActions: { marginTop: 20, gap: 10 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
  },
  editBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: { color: AppColors.status.error, fontWeight: '800', fontSize: 16 },
  ctaBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    minHeight: 52,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
