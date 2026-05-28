import {
  buildStoreContactDraftMessage,
  withListImageCacheBust,
} from '@/components/forum/forumUtils';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { contactCommercialStore } from '@/services/commercialForumApi';
import { contactForumStorePost } from '@/services/forumApi';
import { isComercioUser } from '@/utils/comercioAuth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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

export default function ForumStoreProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    commercialId?: string;
    storeName?: string;
    photoUrl?: string;
    forumPostId?: string;
    postTitle?: string;
  }>();

  const commercialId = String(params.commercialId ?? '').trim();
  const storeName = (params.storeName ?? 'Loja parceira').trim() || 'Loja parceira';
  const forumPostId = String(params.forumPostId ?? '').trim();
  const postTitle = String(params.postTitle ?? '').trim();
  const photoRaw = String(params.photoUrl ?? '').trim();
  const imageEpoch = useMemo(() => Date.now(), []);
  const photoUri = photoRaw ? withListImageCacheBust(photoRaw, imageEpoch) : null;
  const initial = storeName.charAt(0).toUpperCase() || 'L';

  const isVisitante = user?.profile === 'VISITANTE';
  const isCommercialSelf =
    !!user && isComercioUser(user.email ?? '', user.profile ?? '') && commercialId.length > 0;

  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const startContact = useCallback(async () => {
    if (!user?.id || isVisitante) {
      Alert.alert('Login necessário', 'Faça login para falar com a loja.');
      return;
    }
    if (!commercialId) {
      Alert.alert('Erro', 'Loja não identificada.');
      return;
    }
    setContactLoading(true);
    setContactError(null);
    try {
      const draft = buildStoreContactDraftMessage(storeName, postTitle);
      const channel = forumPostId
        ? await contactForumStorePost(forumPostId, draft)
        : await contactCommercialStore(commercialId, draft);
      router.push({
        pathname: '/ChatTab',
        params: {
          provider: JSON.stringify({
            id: commercialId || forumPostId,
            name: storeName,
            image: photoRaw || undefined,
            channelType: channel.channelType,
            channelId: channel.channelId,
            cid: channel.cid,
          }),
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível iniciar a conversa.';
      setContactError(msg);
      Alert.alert('Erro', msg);
    } finally {
      setContactLoading(false);
    }
  }, [commercialId, forumPostId, isVisitante, photoRaw, postTitle, storeName, user?.id]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#fffbeb', '#f0fdfa']} style={styles.hero}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={14} color="#b45309" />
            <Text style={styles.storeBadgeText}>Loja parceira</Text>
          </View>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.storeHint}>
            Publicações desta loja aparecem no fórum do bairro com cupons e promoções.
          </Text>
        </LinearGradient>

        {postTitle ? (
          <View style={styles.postRefCard}>
            <Text style={styles.postRefLabel}>Publicação</Text>
            <Text style={styles.postRefTitle}>{postTitle}</Text>
          </View>
        ) : null}

        {!isCommercialSelf ? (
          <Pressable
            style={({ pressed }) => [styles.contactBtn, pressed && styles.contactBtnPressed]}
            onPress={() => void startContact()}
            disabled={contactLoading || isVisitante}
          >
            {contactLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>Falar com a loja</Text>
              </>
            )}
          </Pressable>
        ) : null}

        {contactError ? <Text style={styles.errorText}>{contactError}</Text> : null}

        {isCommercialSelf ? (
          <Text style={styles.selfHint}>Este é o perfil da sua loja no fórum.</Text>
        ) : null}
      </ScrollView>

      <VisitanteLoginOverlay message="Faça login para conversar com lojas parceiras no fórum." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  hero: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 12,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  storeBadgeText: { fontSize: 12, fontWeight: '700', color: '#b45309' },
  storeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  storeHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  postRefCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  postRefLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.4 },
  postRefTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    borderRadius: 14,
    paddingVertical: 14,
  },
  contactBtnPressed: { opacity: 0.9 },
  contactBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { marginTop: 10, color: AppColors.status.error, fontSize: 13, textAlign: 'center' },
  selfHint: { marginTop: 12, fontSize: 13, color: '#64748b', textAlign: 'center' },
});
