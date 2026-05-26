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
}

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

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    price,
    locationName,
    locationAddress: locationAddress || undefined,
    advertiserContact: phoneDigits,
    imageUri: values.imageUri,
    imageId: values.imageId,
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
  const [imageUri, setImageUri] = useState<string | null>(initial?.imageUri ?? null);
  const [imageId, setImageId] = useState<string | null>(initial?.imageId ?? null);
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permita o acesso à galeria para adicionar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setImageId(null);
      setError(null);
    }
  };

  const handleSubmit = () => {
    try {
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
        imageUri,
        imageId,
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
        <Pressable style={styles.photoCard} onPress={() => void pickImage()}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(15,23,42,0.75)']}
                style={styles.photoOverlay}
              >
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.photoChangeText}>Trocar foto</Text>
              </LinearGradient>
            </>
          ) : (
            <LinearGradient colors={['#7c3aed', '#db2777']} style={styles.photoEmpty}>
              <View style={styles.photoIconCircle}>
                <Ionicons name="camera-outline" size={28} color="#7c3aed" />
              </View>
              <Text style={styles.photoEmptyTitle}>Adicionar foto</Text>
              <Text style={styles.photoEmptyHint}>Toque para escolher da galeria</Text>
            </LinearGradient>
          )}
        </Pressable>

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
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.submitText}>{submitLabel}</Text>
              </>
            )}
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
  photoCard: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  photo: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  photoChangeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  photoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmptyTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  photoEmptyHint: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
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
  submitBtnDisabled: { opacity: 0.85 },
  submitPressed: { opacity: 0.92 },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
