import { AppColors } from '@/constants/theme';
import {
  communityCoverUrl,
  createForumCommunity,
  getForumCommunity,
  parseCommunityCoords,
  updateForumCommunity,
  type ForumCommunityPrivacy,
  type UpdateForumCommunityBody,
} from '@/services/forumCommunityApi';
import { uploadForumImageFromUri } from '@/services/forumApi';
import {
  buildAddressFromViaCep,
  buildLocationNameFromViaCep,
  cepDigitsOnly,
  fetchAddressByCep,
  formatCepDisplay,
} from '@/services/viacep';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MARICA_DEFAULT = { latitude: -22.9189, longitude: -42.8186 };

const CATEGORY_SUGGESTIONS = ['Bairro', 'Esporte', 'Eventos', 'Avisos', 'Cultura', 'Comércio'];

function FormSection({
  title,
  subtitle,
  icon,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionCard, style]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={20} color="#0891b2" />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

type FormSnapshot = {
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  cepDigits: string;
  locationName: string;
  locationAddress: string;
  latitude: number | null;
  longitude: number | null;
};

interface CommunityChannelFormProps {
  mode: 'create' | 'edit';
  communityId?: string;
}

export default function CommunityChannelForm({ mode, communityId }: CommunityChannelFormProps) {
  const isEdit = mode === 'edit';
  const insets = useSafeAreaInsets();
  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [initialSnapshot, setInitialSnapshot] = useState<FormSnapshot | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [cep, setCep] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const lastFetchedCepRef = useRef('');

  const hasLocation = latitude != null && longitude != null;
  const coverPreviewUri =
    coverUri ?? (!coverRemoved && existingCoverUrl ? existingCoverUrl : null);
  const canSubmit = useMemo(
    () => name.trim().length > 0 && !submitting && !loadingInitial,
    [loadingInitial, name, submitting],
  );

  useEffect(() => {
    if (!isEdit || !communityId?.trim()) {
      if (isEdit) {
        setError('Comunidade inválida.');
        setLoadingInitial(false);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingInitial(true);
      setError(null);
      try {
        const c = await getForumCommunity(communityId.trim());
        if (cancelled) return;
        if (c.myRole !== 'OWNER') {
          setError('Somente o dono do canal pode editá-lo.');
          return;
        }
        const coords = parseCommunityCoords(c);
        const cepDigits = (c.cep ?? '').replace(/\D/g, '');
        setName(c.name);
        setDescription(c.description ?? '');
        setCategory(c.category ?? '');
        setIsPrivate(c.privacy === 'PRIVATE');
        setCep(cepDigits ? formatCepDisplay(cepDigits) : '');
        setLocationName(c.locationName ?? '');
        setLocationAddress(c.locationAddress ?? '');
        setLatitude(coords?.lat ?? null);
        setLongitude(coords?.lng ?? null);
        setExistingCoverUrl(communityCoverUrl(c));
        setCoverRemoved(false);
        setCoverUri(null);
        if (cepDigits.length === 8) lastFetchedCepRef.current = cepDigits;
        setInitialSnapshot({
          name: c.name,
          description: c.description ?? '',
          category: c.category ?? '',
          isPrivate: c.privacy === 'PRIVATE',
          cepDigits,
          locationName: c.locationName ?? '',
          locationAddress: c.locationAddress ?? '',
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Não foi possível carregar o canal.');
        }
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communityId, isEdit]);

  const handleCepChange = useCallback((text: string) => {
    const masked = formatCepDisplay(text);
    setCep(masked);
    const digits = cepDigitsOnly(masked);
    if (digits.length < 8) {
      lastFetchedCepRef.current = '';
      setCepFeedback(null);
    }
  }, []);

  const lookupCep = useCallback(async (digits: string) => {
    if (digits.length !== 8 || lastFetchedCepRef.current === digits) return;
    lastFetchedCepRef.current = digits;
    setCepLoading(true);
    setCepFeedback(null);
    try {
      const data = await fetchAddressByCep(digits);
      setLocationAddress(buildAddressFromViaCep(data));
      setLocationName((prev) => {
        const suggested = buildLocationNameFromViaCep(data);
        return prev.trim() ? prev : suggested;
      });
      setCepFeedback({
        type: 'ok',
        text: `${data.localidade} - ${data.uf}${data.bairro ? ` · ${data.bairro}` : ''}`,
      });
    } catch (e) {
      lastFetchedCepRef.current = '';
      setCepFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'CEP não encontrado.',
      });
    } finally {
      setCepLoading(false);
    }
  }, []);

  useEffect(() => {
    const digits = cepDigitsOnly(cep);
    if (digits.length !== 8) return;
    const timer = setTimeout(() => {
      void lookupCep(digits);
    }, 450);
    return () => clearTimeout(timer);
  }, [cep, lookupCep]);

  const pickCover = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setCoverUri(result.assets[0].uri);
      setCoverRemoved(false);
    }
  }, []);

  const removeCover = useCallback(() => {
    setCoverUri(null);
    setCoverRemoved(true);
  }, []);

  const useMyLocation = useCallback(async () => {
    setLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permissão de localização negada.');
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const p = places[0];
      if (p) {
        const addr = [p.street, p.name, p.city, p.region].filter(Boolean).join(', ');
        if (addr && !locationAddress.trim()) setLocationAddress(addr);
        if (p.name && !locationName.trim()) setLocationName(p.name);
      }
    } catch (e) {
      setLatitude(MARICA_DEFAULT.latitude);
      setLongitude(MARICA_DEFAULT.longitude);
      setError(
        e instanceof Error ? e.message : 'Não foi possível obter localização. Usando padrão.',
      );
    } finally {
      setLocating(false);
    }
  }, [locationAddress, locationName]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const privacy: ForumCommunityPrivacy = isPrivate ? 'PRIVATE' : 'PUBLIC';
      let coverMediaId: string | undefined | null = undefined;

      if (coverUri) {
        const up = await uploadForumImageFromUri(coverUri);
        coverMediaId = up.id;
      } else if (isEdit && coverRemoved) {
        coverMediaId = null;
      }

      if (!isEdit) {
        const body = {
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          privacy,
          coverMediaId: coverMediaId ?? undefined,
          cep: cepDigitsOnly(cep) || undefined,
          locationName: locationName.trim() || undefined,
          locationAddress: locationAddress.trim() || undefined,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        };
        const created = await createForumCommunity(body);
        router.replace({
          pathname: '/forum/communities/[id]',
          params: { id: created.id },
        });
        return;
      }

      if (!communityId?.trim() || !initialSnapshot) {
        throw new Error('Dados do canal indisponíveis.');
      }

      const patch: UpdateForumCommunityBody = {};
      const trimmedName = name.trim();
      const trimmedDesc = description.trim();
      const trimmedCategory = category.trim();
      const cepD = cepDigitsOnly(cep);
      const trimmedLocName = locationName.trim();
      const trimmedLocAddr = locationAddress.trim();

      if (trimmedName !== initialSnapshot.name) patch.name = trimmedName;
      if (trimmedDesc !== initialSnapshot.description) {
        patch.description = trimmedDesc || null;
      }
      if (trimmedCategory !== initialSnapshot.category) {
        patch.category = trimmedCategory || null;
      }
      if (isPrivate !== initialSnapshot.isPrivate) patch.privacy = privacy;
      if (cepD !== initialSnapshot.cepDigits) patch.cep = cepD || null;
      if (trimmedLocName !== initialSnapshot.locationName) {
        patch.locationName = trimmedLocName || null;
      }
      if (trimmedLocAddr !== initialSnapshot.locationAddress) {
        patch.locationAddress = trimmedLocAddr || null;
      }
      if (latitude !== initialSnapshot.latitude) patch.latitude = latitude;
      if (longitude !== initialSnapshot.longitude) patch.longitude = longitude;
      if (coverMediaId !== undefined) patch.coverMediaId = coverMediaId;

      if (Object.keys(patch).length === 0) {
        router.back();
        return;
      }

      await updateForumCommunity(communityId.trim(), patch);
      router.replace({
        pathname: '/forum/communities/[id]',
        params: { id: communityId.trim() },
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isEdit
            ? 'Não foi possível salvar as alterações.'
            : 'Não foi possível criar a comunidade.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    category,
    cep,
    communityId,
    coverRemoved,
    coverUri,
    description,
    initialSnapshot,
    isEdit,
    isPrivate,
    latitude,
    locationAddress,
    locationName,
    longitude,
    name,
  ]);

  if (loadingInitial) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingScreenText}>Carregando canal...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.flex}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#0e7490', '#0891b2', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIconWrap}>
              <Ionicons name={isEdit ? 'create' : 'people'} size={28} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>{isEdit ? 'Editar canal' : 'Novo canal'}</Text>
            <Text style={styles.heroSubtitle}>
              {isEdit
                ? 'Atualize nome, capa, privacidade e local do seu canal.'
                : 'Crie um espaço para o bairro conversar, avisar e se organizar.'}
            </Text>
          </LinearGradient>

          <FormSection
            title="Identidade do canal"
            subtitle="Como as pessoas vão reconhecer sua comunidade"
            icon="color-palette-outline"
          >
            <Pressable style={styles.coverPicker} onPress={() => void pickCover()}>
              {coverPreviewUri ? (
                <>
                  <Image
                    source={{ uri: coverPreviewUri }}
                    style={styles.coverPreview}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15,23,42,0.55)']}
                    style={styles.coverGradient}
                  />
                </>
              ) : (
                <LinearGradient
                  colors={['#ecfeff', '#f0fdfa', '#e0f2fe']}
                  style={styles.coverEmpty}
                >
                  <View style={styles.coverEmptyIcon}>
                    <Ionicons name="image-outline" size={28} color="#0891b2" />
                  </View>
                  <Text style={styles.coverEmptyTitle}>
                    {isEdit ? 'Adicionar nova capa' : 'Adicionar capa'}
                  </Text>
                  <Text style={styles.coverEmptyHint}>Opcional · proporção 16:9</Text>
                </LinearGradient>
              )}
              <View style={styles.coverEditBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </Pressable>
            {isEdit && coverPreviewUri ? (
              <Pressable onPress={removeCover} style={styles.removeCoverBtn}>
                <Ionicons name="trash-outline" size={16} color={AppColors.status.error} />
                <Text style={styles.removeCoverText}>Remover capa</Text>
              </Pressable>
            ) : null}

            <View style={styles.field}>
              <FieldLabel label="Nome do canal" required />
              <TextInput
                style={styles.input}
                placeholder="Ex.: Moradores da Praça Central"
                placeholderTextColor={AppColors.text.quaternary}
                value={name}
                onChangeText={setName}
                maxLength={255}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Descrição" />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Conte o propósito do canal, regras leves ou o que esperam encontrar aqui..."
                placeholderTextColor={AppColors.text.quaternary}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                maxLength={10000}
              />
              <Text style={styles.charHint}>{description.length}/10000</Text>
            </View>

            <View style={styles.field}>
              <FieldLabel label="Categoria" />
              <TextInput
                style={styles.input}
                placeholder="Ex.: bairro, esporte, avisos"
                placeholderTextColor={AppColors.text.quaternary}
                value={category}
                onChangeText={setCategory}
                maxLength={100}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {CATEGORY_SUGGESTIONS.map((item) => {
                  const active = category.trim().toLowerCase() === item.toLowerCase();
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          active && styles.categoryChipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </FormSection>

          <FormSection
            title="Quem pode ver"
            subtitle="Canais públicos aparecem para seguir no carrossel"
            icon="shield-checkmark-outline"
          >
            <View style={styles.privacyRow}>
              <Pressable
                onPress={() => setIsPrivate(false)}
                style={[styles.privacyCard, !isPrivate && styles.privacyCardActive]}
              >
                <Ionicons
                  name="earth-outline"
                  size={22}
                  color={!isPrivate ? '#0891b2' : AppColors.text.quaternary}
                />
                <Text style={[styles.privacyTitle, !isPrivate && styles.privacyTitleActive]}>
                  Público
                </Text>
                <Text style={styles.privacyHint}>Qualquer pessoa pode seguir</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsPrivate(true)}
                style={[styles.privacyCard, isPrivate && styles.privacyCardActive]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={isPrivate ? '#0891b2' : AppColors.text.quaternary}
                />
                <Text style={[styles.privacyTitle, isPrivate && styles.privacyTitleActive]}>
                  Privado
                </Text>
                <Text style={styles.privacyHint}>Só membros acessam</Text>
              </Pressable>
            </View>
          </FormSection>

          <FormSection
            title="Local no mapa"
            subtitle="Ajuda vizinhos a encontrar o ponto de encontro"
            icon="location-outline"
          >
            <View style={styles.field}>
              <FieldLabel label="CEP" />
              <View style={styles.cepRow}>
                <TextInput
                  style={[styles.input, styles.cepInput]}
                  placeholder="00000-000"
                  placeholderTextColor={AppColors.text.quaternary}
                  value={cep}
                  onChangeText={handleCepChange}
                  keyboardType="number-pad"
                  maxLength={9}
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    const digits = cepDigitsOnly(cep);
                    if (digits.length === 8) void lookupCep(digits);
                  }}
                />
                <View style={styles.cepStatus}>
                  {cepLoading ? (
                    <ActivityIndicator size="small" color="#0891b2" />
                  ) : cepFeedback?.type === 'ok' ? (
                    <Ionicons name="checkmark-circle" size={22} color="#059669" />
                  ) : cepFeedback?.type === 'err' ? (
                    <Ionicons name="alert-circle" size={22} color={AppColors.status.error} />
                  ) : (
                    <Ionicons name="search" size={20} color={AppColors.text.quaternary} />
                  )}
                </View>
              </View>
              {cepFeedback ? (
                <Text
                  style={[
                    styles.cepFeedback,
                    cepFeedback.type === 'ok' ? styles.cepFeedbackOk : styles.cepFeedbackErr,
                  ]}
                >
                  {cepFeedback.text}
                </Text>
              ) : (
                <Text style={styles.cepHint}>
                  O endereço é preenchido automaticamente ao digitar o CEP completo.
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <FieldLabel label="Nome do local" />
              <TextInput
                style={styles.input}
                placeholder="Ex.: Praça Central"
                placeholderTextColor={AppColors.text.quaternary}
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Endereço" />
              <TextInput
                style={styles.input}
                placeholder="Rua, número, bairro"
                placeholderTextColor={AppColors.text.quaternary}
                value={locationAddress}
                onChangeText={setLocationAddress}
              />
            </View>

            <Pressable
              style={[styles.locationBtn, hasLocation && styles.locationBtnSuccess]}
              onPress={() => void useMyLocation()}
              disabled={locating}
            >
              <View style={styles.locationBtnIcon}>
                {locating ? (
                  <ActivityIndicator color="#0891b2" size="small" />
                ) : (
                  <Ionicons
                    name={hasLocation ? 'checkmark-circle' : 'navigate'}
                    size={22}
                    color={hasLocation ? '#059669' : '#0891b2'}
                  />
                )}
              </View>
              <View style={styles.locationBtnTextWrap}>
                <Text style={styles.locationBtnTitle}>
                  {hasLocation ? 'Localização definida' : 'Usar minha localização'}
                </Text>
                <Text style={styles.locationBtnHint}>
                  {hasLocation
                    ? `${latitude!.toFixed(4)}, ${longitude!.toFixed(4)} · toque para atualizar`
                    : 'Marca o ponto no mapa do canal'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
            </Pressable>
          </FormSection>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={AppColors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            onPress={() => void onSubmit()}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitWrap,
              !canSubmit && styles.submitWrapDisabled,
              pressed && canSubmit && styles.submitPressed,
            ]}
          >
            <LinearGradient
              colors={canSubmit ? ['#0e7490', '#0891b2', '#14b8a6'] : ['#94a3b8', '#94a3b8']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isEdit ? 'checkmark-circle' : 'add-circle'}
                    size={22}
                    color="#fff"
                  />
                  <Text style={styles.submitText}>
                    {isEdit ? 'Salvar alterações' : 'Criar canal'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={styles.footerHint}>
            {isEdit
              ? 'Somente o dono pode alterar as informações do canal.'
              : 'Você será o dono do canal e poderá publicar assim que criar.'}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ECEFF3' },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ECEFF3',
  },
  loadingScreenText: {
    color: AppColors.text.tertiary,
    fontWeight: '600',
    fontSize: 14,
  },
  removeCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  removeCoverText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.status.error,
  },
  container: { flex: 1 },
  scroll: { paddingBottom: 8 },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 280,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 2,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    marginTop: 2,
    lineHeight: 18,
    fontWeight: '500',
  },
  coverPicker: {
    height: 172,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#a5f3fc',
    backgroundColor: '#f0fdfa',
  },
  coverPreview: { width: '100%', height: '100%' },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  coverEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(8,145,178,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  coverEmptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0e7490',
  },
  coverEmptyHint: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    fontWeight: '500',
  },
  coverEditBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  required: { color: '#ef4444' },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.text.secondary,
    backgroundColor: '#f8fafc',
  },
  textarea: { minHeight: 100, paddingTop: 12 },
  charHint: {
    fontSize: 11,
    color: AppColors.text.quaternary,
    textAlign: 'right',
    fontWeight: '600',
  },
  chipScroll: { gap: 8, paddingTop: 4 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  categoryChipActive: {
    backgroundColor: '#ecfeff',
    borderColor: '#0891b2',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
  },
  categoryChipTextActive: { color: '#0e7490' },
  privacyRow: { flexDirection: 'row', gap: 10 },
  privacyCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: AppColors.border.muted,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    gap: 6,
  },
  privacyCardActive: {
    borderColor: '#0891b2',
    backgroundColor: '#ecfeff',
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.text.tertiary,
  },
  privacyTitleActive: { color: '#0e7490' },
  privacyHint: {
    fontSize: 11,
    color: AppColors.text.quaternary,
    textAlign: 'center',
    fontWeight: '500',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  locationBtnSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  locationBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBtnTextWrap: { flex: 1, minWidth: 0 },
  locationBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  locationBtnHint: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  cepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cepInput: { flex: 1 },
  cepStatus: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cepHint: {
    fontSize: 12,
    color: AppColors.text.quaternary,
    fontWeight: '500',
    lineHeight: 16,
  },
  cepFeedback: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  cepFeedbackOk: { color: '#059669' },
  cepFeedbackErr: { color: AppColors.status.error },
  errorBox: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: {
    flex: 1,
    color: AppColors.status.error,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: AppColors.background.default,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  submitWrap: { borderRadius: 16, overflow: 'hidden' },
  submitWrapDisabled: { opacity: 0.7 },
  submitPressed: { opacity: 0.92 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  footerHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.text.quaternary,
    fontWeight: '500',
    lineHeight: 16,
  },
});
