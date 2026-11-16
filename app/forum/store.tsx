import ComercianteProfileModal from '@/components/comerciante/ComercianteProfileModal';
import LinkedPhotoMural from '@/components/forum/LinkedPhotoMural';
import StoreProfileGallery from '@/components/forum/StoreProfileGallery';
import StoreProfilePosts from '@/components/forum/StoreProfilePosts';
import StoreProfileReviews from '@/components/forum/StoreProfileReviews';
import {
  buildStoreContactDraftMessage,
  withListImageCacheBust,
} from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getCommercialStorePublicProfile } from '@/services/commercialStoreApi';
import { contactCommercialStore } from '@/services/commercialForumApi';
import { getCommercialMyProfile } from '@/services/commercialProfileApi';
import { contactForumStorePost, getForumPost } from '@/services/forumApi';
import type { CommercialStorePublicProfile } from '@/types/forumCommercial';
import { isComercioUser } from '@/utils/comercioAuth';
import {
  commercialMyProfileToPublic,
  forumPostToStoreProfile,
  buildStoreGeocodeQuery,
  geocodeStoreLocation,
  mergeCommercialStoreProfiles,
  resolveStoreDirectionsCoords,
  resolveStoreMapTarget,
  storeProfileFromRouteParams,
} from '@/utils/commercialStoreProfile';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
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

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#0d9488" />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.infoValueLink]}>{value}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color="#94a3b8" /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.infoRowPressed}>
      {content}
    </Pressable>
  );
}

export default function ForumStoreProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    commercialId?: string;
    storeName?: string;
    photoUrl?: string;
    forumPostId?: string;
    postTitle?: string;
    locationDescription?: string;
    address?: string;
    phone?: string;
    description?: string;
    cep?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const commercialId = String(params.commercialId ?? '').trim();
  const forumPostId = String(params.forumPostId ?? '').trim();
  const postTitle = String(params.postTitle ?? '').trim();
  const photoRaw = String(params.photoUrl ?? '').trim();
  const imageEpoch = useMemo(() => Date.now(), []);

  const [storeProfile, setStoreProfile] = useState<CommercialStorePublicProfile | null>(() =>
    storeProfileFromRouteParams(params),
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [geocodedCoords, setGeocodedCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const storeName =
    (storeProfile?.storeName ?? params.storeName ?? 'Loja parceira').trim() || 'Loja parceira';
  const photoUri = useMemo(() => {
    const raw = storeProfile?.photoUrl?.trim() || photoRaw;
    return raw ? withListImageCacheBust(raw, imageEpoch) : null;
  }, [imageEpoch, photoRaw, storeProfile?.photoUrl]);
  const initial = storeName.charAt(0).toUpperCase() || 'L';

  const isVisitante = user?.profile === 'VISITANTE';
  const isCommercialUser = !!user && isComercioUser(user.email ?? '', user.profile ?? '');

  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isOwnStore, setIsOwnStore] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileReloadToken, setProfileReloadToken] = useState(0);

  const ownsThisStore =
    isCommercialUser &&
    !!user?.id?.trim() &&
    !!commercialId &&
    commercialId === user.id.trim();
  const viewingOwnStore = ownsThisStore || isOwnStore;

  const routeProfile = useMemo(() => storeProfileFromRouteParams(params), [
    commercialId,
    params.storeName,
    params.photoUrl,
    params.address,
    params.phone,
    params.description,
    params.cep,
    params.latitude,
    params.longitude,
    params.locationDescription,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!commercialId) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      const sources: Array<CommercialStorePublicProfile | null> = [routeProfile];
      let fromPost: CommercialStorePublicProfile | null = null;
      let fromApi: CommercialStorePublicProfile | null = null;

      if (forumPostId) {
        try {
          const post = await getForumPost(forumPostId);
          if (!cancelled) fromPost = forumPostToStoreProfile(post);
        } catch {
          /* ignore */
        }
      }

      if (isCommercialUser) {
        try {
          const mine = await getCommercialMyProfile();
          if (!cancelled && mine.id.trim() === commercialId) {
            setIsOwnStore(true);
            sources.push(commercialMyProfileToPublic(mine));
          }
        } catch {
          /* ignore */
        }
      }

      try {
        fromApi = await getCommercialStorePublicProfile(commercialId);
      } catch {
        /* API indisponível: usa dados do post e da navegação */
      }

      if (!cancelled) {
        if (fromPost) sources.push(fromPost);
        if (fromApi) sources.push(fromApi);
        setStoreProfile(mergeCommercialStoreProfiles(...sources));
        setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [commercialId, forumPostId, isCommercialUser, routeProfile, profileReloadToken]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: viewingOwnStore ? 'Minha loja' : 'Loja parceira',
      headerRight: () =>
        viewingOwnStore ? (
          <Pressable
            onPress={() => setEditProfileOpen(true)}
            style={({ pressed }) => [styles.headerSettingsBtn, pressed && styles.btnPressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Editar informações da loja"
          >
            <Ionicons name="settings-outline" size={22} color="#475569" />
          </Pressable>
        ) : (
          <View style={styles.headerSettingsSpacer} />
        ),
    });
  }, [navigation, viewingOwnStore]);

  useEffect(() => {
    let cancelled = false;

    async function geocode() {
      if (!storeProfile) {
        setGeocodedCoords(null);
        return;
      }
      if (
        storeProfile.latitude != null &&
        Number.isFinite(storeProfile.latitude) &&
        storeProfile.longitude != null &&
        Number.isFinite(storeProfile.longitude)
      ) {
        setGeocodedCoords(null);
        return;
      }

      const query = buildStoreGeocodeQuery(storeProfile);
      if (!query) {
        setGeocodedCoords(null);
        return;
      }

      setGeocodeLoading(true);
      const coords = await geocodeStoreLocation(query);
      if (!cancelled) {
        setGeocodedCoords(coords);
        setGeocodeLoading(false);
      }
    }

    void geocode();
    return () => {
      cancelled = true;
    };
  }, [storeProfile]);

  const mapTarget = useMemo(
    () => resolveStoreMapTarget(storeProfile, geocodedCoords),
    [geocodedCoords, storeProfile],
  );

  const hasMapCoords = mapTarget != null && 'latitude' in mapTarget;

  const locationLine = useMemo(() => {
    if (!storeProfile) return null;
    return (
      storeProfile.address?.trim() ||
      storeProfile.locationDescription?.trim() ||
      null
    );
  }, [storeProfile]);

  const canShowDirections = !profileLoading && !!(locationLine || hasMapCoords);

  const openInAppDirections = useCallback(async () => {
    if (!storeProfile || routeLoading) return;
    setRouteLoading(true);
    try {
      const coords = await resolveStoreDirectionsCoords(storeProfile, geocodedCoords);
      if (!coords) {
        Alert.alert(
          'Localização',
          'Não foi possível localizar o endereço da loja. Verifique se o endereço está cadastrado corretamente.',
        );
        return;
      }
      setGeocodedCoords(coords);
      router.push({
        pathname: '/(tabs)/map',
        params: {
          focusLat: String(coords.latitude),
          focusLng: String(coords.longitude),
          focusLabel: storeName,
          focusAddress: storeProfile.address?.trim() || '',
          traceRoute: '1',
          routeKey: String(Date.now()),
        },
      });
    } finally {
      setRouteLoading(false);
    }
  }, [geocodedCoords, routeLoading, storeName, storeProfile]);

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
      const draftMessage = buildStoreContactDraftMessage(storeName, postTitle);
      const channel = forumPostId
        ? await contactForumStorePost(forumPostId, draftMessage)
        : await contactCommercialStore(commercialId, draftMessage);
      router.push({
        pathname: '/ChatTab',
        params: {
          provider: JSON.stringify({
            id: commercialId || forumPostId,
            name: storeName,
            image: storeProfile?.photoUrl?.trim() || photoRaw || undefined,
            channelType: channel.channelType,
            channelId: channel.channelId,
            cid: channel.cid,
            draftMessage,
            autoSentDraftMessageId: channel.messageId?.trim() || undefined,
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
  }, [
    commercialId,
    forumPostId,
    isVisitante,
    photoRaw,
    postTitle,
    storeName,
    storeProfile?.photoUrl,
    user?.id,
  ]);

  const description = storeProfile?.description?.trim() || '';
  const phone = storeProfile?.phone?.trim() || '';
  const cep = storeProfile?.cep?.trim() || '';
  const hasEstablishmentDetails = !!(phone || cep);
  const hasAbout = !!description;
  const galleryImages = storeProfile?.galleryImageUrls ?? [];

  const handleGalleryChange = useCallback((urls: string[]) => {
    setStoreProfile((prev) => (prev ? { ...prev, galleryImageUrls: urls } : prev));
  }, []);

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
            Loja parceira do feed da cidade — cupons, promoções e atendimento direto pelo app.
          </Text>
        </LinearGradient>

        {profileLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#0d9488" />
            <Text style={styles.loadingText}>Carregando informações da loja…</Text>
          </View>
        ) : null}

        {!profileLoading && hasAbout ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sobre a loja</Text>
            <Text style={styles.aboutText}>{description}</Text>
          </View>
        ) : null}

        {!profileLoading && commercialId ? (
          <StoreProfilePosts commercialAccountId={commercialId} />
        ) : null}

        {!profileLoading && commercialId ? (
          <StoreProfileReviews
            commercialAccountId={commercialId}
            canReview={!viewingOwnStore && !isVisitante}
            loginHint={isVisitante && !viewingOwnStore}
          />
        ) : null}

        {!profileLoading ? (
          <View style={styles.sectionCard}>
            <LinkedPhotoMural commercialAccountId={commercialId} />
          </View>
        ) : null}

        {!profileLoading ? (
          <StoreProfileGallery
            images={galleryImages}
            editable={viewingOwnStore}
            imageEpoch={imageEpoch}
            onImagesChange={viewingOwnStore ? handleGalleryChange : undefined}
          />
        ) : null}

        {!profileLoading && hasEstablishmentDetails ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contato e dados</Text>
            {cep ? <InfoRow icon="mail-outline" label="CEP" value={cep} /> : null}
            {phone ? <InfoRow icon="call-outline" label="Telefone" value={phone} /> : null}
          </View>
        ) : null}

        {!profileLoading && !hasAbout && !hasEstablishmentDetails && !locationLine ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Informações</Text>
            <Text style={styles.locationMuted}>
              Esta loja ainda não completou o cadastro de endereço e contato no perfil.
            </Text>
          </View>
        ) : null}

        {canShowDirections ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Localização</Text>
            {locationLine ? (
              <Text style={styles.locationText}>{locationLine}</Text>
            ) : geocodeLoading ? (
              <Text style={styles.locationMuted}>Buscando localização no mapa…</Text>
            ) : null}

            <View style={styles.mapActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.mapBtnPrimary,
                  pressed && styles.btnPressed,
                  (routeLoading || geocodeLoading) && styles.mapBtnDisabled,
                ]}
                onPress={() => void openInAppDirections()}
                disabled={routeLoading || geocodeLoading}
              >
                {routeLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="navigate-outline" size={18} color="#fff" />
                )}
                <Text style={styles.mapBtnPrimaryText}>
                  {routeLoading ? 'Calculando rota…' : 'Como chegar'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {postTitle ? (
          <View style={styles.postRefCard}>
            <Text style={styles.postRefLabel}>Publicação</Text>
            <Text style={styles.postRefTitle}>{postTitle}</Text>
          </View>
        ) : null}

        {isVisitante && !isOwnStore ? (
          <Text style={styles.loginHint}>
            Faça login com uma conta cadastrada para conversar com a loja.
          </Text>
        ) : null}

        {!isOwnStore && !isVisitante ? (
          <Pressable
            style={({ pressed }) => [styles.contactBtn, pressed && styles.btnPressed]}
            onPress={() => void startContact()}
            disabled={contactLoading}
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

        {viewingOwnStore ? (
          <View style={styles.ownStoreBanner}>
            <Ionicons name="storefront-outline" size={18} color="#0d9488" />
            <Text style={styles.ownStoreBannerText}>
              Este é o perfil público da sua loja no feed. Toque na engrenagem para editar dados de
              contato e endereço.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <ComercianteProfileModal
        visible={editProfileOpen}
        onClose={() => {
          setEditProfileOpen(false);
          setProfileReloadToken((t) => t + 1);
        }}
      />
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
  aboutText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingText: { fontSize: 13, color: '#64748b' },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  infoRowPressed: { opacity: 0.85 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1e293b', lineHeight: 20 },
  infoValueLink: { color: '#0d9488' },
  locationText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 12,
  },
  locationMuted: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12,
  },
  mapActions: { gap: 10 },
  mapBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 12,
  },
  mapBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  mapBtnDisabled: { opacity: 0.5 },
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
  btnPressed: { opacity: 0.9 },
  contactBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginHint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
  },
  errorText: { marginTop: 10, color: AppColors.status.error, fontSize: 13, textAlign: 'center' },
  headerSettingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerSettingsSpacer: { width: 40, height: 40 },
  ownStoreBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  ownStoreBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#0f766e',
    fontWeight: '500',
  },
});
