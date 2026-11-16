import {
  getMarketplaceCategoryMeta,
  MARKETPLACE_CATEGORY_META,
} from '@/constants/marketplaceCategories';
import { AppColors } from '@/constants/theme';
import {
  buildAddressFromViaCep,
  buildLocationNameFromViaCep,
  cepDigitsOnly,
  fetchAddressByCep,
  formatCepDisplay,
} from '@/services/viacep';
import type { MarketplaceCategoryId, MarketplaceListingInput } from '@/types/marketplace';
import { formatMarketplacePrice, parsePriceInputToReais } from '@/utils/marketplaceFormat';
import { formatBrazilPhoneInput } from '@/utils/phoneMask';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type MarketplaceFormImage = {
  uri: string;
  id: string | null;
};

export interface MarketplaceFormValues {
  title: string;
  description: string;
  category: MarketplaceCategoryId;
  priceText: string;
  usePickupLocation: boolean;
  cep: string;
  locationName: string;
  locationAddress: string;
  streetNumber: string;
  advertiserContact: string;
  imageUri: string | null;
  imageId: string | null;
  images: MarketplaceFormImage[];
}

const MAX_PRODUCT_PHOTOS = 8;

interface MarketplaceProductFormProps {
  initial?: Partial<MarketplaceFormValues>;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (values: MarketplaceListingInput) => void;
}

const CATEGORY_KEYS = Object.keys(MARKETPLACE_CATEGORY_META) as MarketplaceCategoryId[];

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
        <LinearGradient
          colors={['#ede9fe', '#fae8ff']}
          style={styles.sectionIconWrap}
        >
          <Ionicons name={icon} size={20} color="#7c3aed" />
        </LinearGradient>
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

export function formValuesToListingInput(values: MarketplaceFormValues): MarketplaceListingInput {
  const price = parsePriceInputToReais(values.priceText);
  if (price === null) {
    throw new Error('Informe um preço válido.');
  }
  if (!values.title.trim()) throw new Error('Informe o título do produto.');
  if (!values.description.trim()) throw new Error('Informe a descrição.');

  const phoneDigits = values.advertiserContact.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    throw new Error('Informe um telefone ou WhatsApp válido.');
  }

  let locationName = values.locationName.trim();
  let locationAddress = values.locationAddress.trim();

  if (values.usePickupLocation) {
    if (!locationName) {
      throw new Error('Informe o bairro ou use o CEP para preencher o local.');
    }
    if (values.streetNumber.trim()) {
      locationAddress = locationAddress
        ? `${locationAddress}, ${values.streetNumber.trim()}`
        : values.streetNumber.trim();
    }
  } else {
    locationName = 'A combinar';
    locationAddress = '';
  }

  const images =
    values.images?.length > 0
      ? values.images
      : values.imageUri
        ? [{ uri: values.imageUri, id: values.imageId }]
        : [];
  if (images.length === 0) {
    throw new Error('Adicione ao menos uma foto do produto.');
  }

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    price,
    locationName,
    locationAddress: locationAddress || undefined,
    advertiserContact: phoneDigits,
    imageUri: images[0]?.uri ?? null,
    imageId: images[0]?.id ?? null,
    images,
  };
}

export default function MarketplaceProductForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
}: MarketplaceProductFormProps) {
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<MarketplaceCategoryId>(initial?.category ?? 'outros');
  const [priceText, setPriceText] = useState(initial?.priceText ?? '');
  const [usePickupLocation, setUsePickupLocation] = useState(initial?.usePickupLocation ?? true);
  const [cep, setCep] = useState(initial?.cep ?? '');
  const [locationName, setLocationName] = useState(initial?.locationName ?? '');
  const [locationAddress, setLocationAddress] = useState(initial?.locationAddress ?? '');
  const [streetNumber, setStreetNumber] = useState(initial?.streetNumber ?? '');
  const [advertiserContact, setAdvertiserContact] = useState(
    initial?.advertiserContact ? formatBrazilPhoneInput(initial.advertiserContact) : '',
  );
  const [images, setImages] = useState<MarketplaceFormImage[]>(() => {
    if (initial?.images && initial.images.length > 0) return initial.images;
    if (initial?.imageUri) {
      return [{ uri: initial.imageUri, id: initial.imageId ?? null }];
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);

  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const lastFetchedCepRef = useRef('');

  const pricePreview = useMemo(() => {
    const value = parsePriceInputToReais(priceText);
    return value !== null ? formatMarketplacePrice(value) : null;
  }, [priceText]);

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
      const suggested = buildLocationNameFromViaCep(data);
      if (suggested) setLocationName(suggested);
      setCepFeedback({ type: 'ok', text: 'Endereço encontrado.' });
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
    if (!usePickupLocation) return;
    const digits = cepDigitsOnly(cep);
    if (digits.length === 8) {
      const t = setTimeout(() => void lookupCep(digits), 400);
      return () => clearTimeout(t);
    }
  }, [cep, lookupCep, usePickupLocation]);

  const pickImages = async () => {
    const remaining = MAX_PRODUCT_PHOTOS - images.length;
    if (remaining <= 0) {
      setError(`Você pode adicionar no máximo ${MAX_PRODUCT_PHOTOS} fotos.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permita o acesso à galeria para adicionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const next = result.assets
      .map((asset) => asset.uri)
      .filter(Boolean)
      .map((uri) => ({ uri, id: null as string | null }));
    setImages((prev) => [...prev, ...next].slice(0, MAX_PRODUCT_PHOTOS));
    setError(null);
  };

  const removeImageAt = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    try {
      const cover = images[0] ?? null;
      const input = formValuesToListingInput({
        title,
        description,
        category,
        priceText,
        usePickupLocation,
        cep,
        locationName,
        locationAddress,
        streetNumber,
        advertiserContact,
        imageUri: cover?.uri ?? null,
        imageId: cover?.id ?? null,
        images,
      });
      setError(null);
      onSubmit(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revise os campos do anúncio.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormSection
          title="Fotos do produto"
          subtitle={`Até ${MAX_PRODUCT_PHOTOS} fotos · a primeira é a capa`}
          icon="images-outline"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {images.map((photo, index) => (
              <View key={`${photo.uri}-${index}`} style={styles.galleryThumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.galleryThumb} />
                {index === 0 ? (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Capa</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => removeImageAt(index)}
                  style={styles.galleryRemove}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remover foto"
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_PRODUCT_PHOTOS ? (
              <Pressable
                style={styles.galleryAdd}
                onPress={() => void pickImages()}
                accessibilityRole="button"
                accessibilityLabel="Adicionar fotos"
              >
                <Ionicons name="add" size={28} color="#7c3aed" />
                <Text style={styles.galleryAddText}>
                  {images.length === 0 ? 'Adicionar' : 'Mais fotos'}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </FormSection>

        <FormSection
          title="Sobre o produto"
          subtitle="Título, descrição e categoria"
          icon="pricetag-outline"
        >
          <View style={styles.field}>
            <FieldLabel label="Título" required />
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex.: Bicicleta urbana aro 29"
              placeholderTextColor={AppColors.text.quaternary}
              maxLength={120}
            />
          </View>

          <View style={styles.field}>
            <FieldLabel label="Descrição" required />
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Estado, acessórios, formas de entrega..."
              placeholderTextColor={AppColors.text.quaternary}
              multiline
              textAlignVertical="top"
              maxLength={4000}
            />
          </View>

          <View style={styles.field}>
            <FieldLabel label="Categoria" required />
            <View style={styles.categories}>
              {CATEGORY_KEYS.map((key) => {
                const meta = getMarketplaceCategoryMeta(key);
                const selected = category === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setCategory(key)}
                    style={[styles.catChip, selected && styles.catChipActive]}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={14}
                      color={selected ? '#fff' : meta.color}
                    />
                    <Text style={[styles.catChipText, selected && styles.catChipTextActive]}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel label="Preço" required />
            <View style={styles.priceRow}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={priceText}
                onChangeText={setPriceText}
                placeholder="0,00"
                placeholderTextColor={AppColors.text.quaternary}
                keyboardType="decimal-pad"
              />
            </View>
            {pricePreview ? <Text style={styles.pricePreview}>{pricePreview}</Text> : null}
          </View>
        </FormSection>

        <FormSection
          title="Local de retirada"
          subtitle="Opcional — ajuda o comprador a encontrar você"
          icon="location-outline"
        >
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Informar local de retirada</Text>
              <Text style={styles.toggleHint}>
                {usePickupLocation
                  ? 'Use o CEP para preencher o endereço automaticamente.'
                  : 'O local será exibido como "A combinar".'}
              </Text>
            </View>
            <Switch
              value={usePickupLocation}
              onValueChange={setUsePickupLocation}
              trackColor={{ false: '#cbd5e1', true: '#c4b5fd' }}
              thumbColor={usePickupLocation ? '#7c3aed' : '#f8fafc'}
            />
          </View>

          {usePickupLocation ? (
            <>
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
                      <ActivityIndicator size="small" color="#7c3aed" />
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
                    O endereço é preenchido ao digitar o CEP completo.
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <FieldLabel label="Bairro / região" required />
                <TextInput
                  style={styles.input}
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="Ex.: Centro"
                  placeholderTextColor={AppColors.text.quaternary}
                  maxLength={120}
                />
              </View>

              <View style={styles.field}>
                <FieldLabel label="Endereço" />
                <TextInput
                  style={styles.input}
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                  placeholder="Rua, bairro, cidade"
                  placeholderTextColor={AppColors.text.quaternary}
                  maxLength={200}
                />
              </View>

              <View style={styles.field}>
                <FieldLabel label="Número / complemento" />
                <TextInput
                  style={styles.input}
                  value={streetNumber}
                  onChangeText={setStreetNumber}
                  placeholder="Ex.: 100, apto 12"
                  placeholderTextColor={AppColors.text.quaternary}
                  maxLength={80}
                />
              </View>
            </>
          ) : null}
        </FormSection>

        <FormSection
          title="Contato"
          subtitle="Quem se interessar vai falar com você pelo app"
          icon="call-outline"
        >
          <View style={styles.field}>
            <FieldLabel label="Telefone / WhatsApp" required />
            <TextInput
              style={styles.input}
              value={advertiserContact}
              onChangeText={(t) => setAdvertiserContact(formatBrazilPhoneInput(t))}
              placeholder="(11) 99999-9999"
              placeholderTextColor={AppColors.text.quaternary}
              keyboardType="phone-pad"
              maxLength={16}
            />
          </View>
        </FormSection>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [pressed && styles.submitPressed]}
        >
          <LinearGradient
            colors={loading ? ['#a78bfa', '#f0abfc'] : ['#7c3aed', '#db2777']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          >
            <View style={styles.submitInner}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              )}
              {!loading ? <Text style={styles.submitText}>{submitLabel}</Text> : null}
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  galleryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  galleryThumbWrap: {
    width: 104,
    height: 104,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  galleryThumb: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: 'rgba(124,58,237,0.92)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  galleryRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryAdd: {
    width: 104,
    height: 104,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#c4b5fd',
    borderStyle: 'dashed',
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  galleryAddText: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    marginTop: 2,
    lineHeight: 18,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  required: { color: '#db2777' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.text.secondary,
    backgroundColor: '#f8fafc',
  },
  textarea: { minHeight: 108 },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  catChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  catChipTextActive: { color: '#fff' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  priceInput: { flex: 1 },
  pricePreview: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  toggleTextWrap: { flex: 1 },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  toggleHint: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 4,
    lineHeight: 17,
  },
  cepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cepInput: { flex: 1 },
  cepStatus: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cepHint: {
    fontSize: 12,
    color: AppColors.text.quaternary,
    lineHeight: 17,
  },
  cepFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  cepFeedbackOk: { color: '#059669' },
  cepFeedbackErr: { color: AppColors.status.error },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    color: AppColors.status.error,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 24,
  },
  submitBtnDisabled: { opacity: 0.85 },
  submitPressed: { opacity: 0.92 },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
