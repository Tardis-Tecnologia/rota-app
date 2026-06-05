import type { CargoPrestadorId } from '@/constants/providerCategories';
import { CARGOS_PRESTADORES } from '@/constants/providerCategories';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  createServiceProvider,
  getServiceProviderById,
  updateServiceProvider,
} from '@/services/serviceProvidersApi';
import {
    buildAddressFromViaCep,
    buildLocationNameFromViaCep,
    cepDigitsOnly,
    fetchAddressByCep,
    formatCepDisplay,
} from '@/services/viacep';
import { formatCnpjInput } from '@/utils/cnpjMask';
import { GUIA_DEFAULT_CENTER } from '@/utils/guiaGeo';
import { formatBrazilPhoneInput } from '@/utils/phoneMask';
import type { ServiceProviderStatus } from '@/types/serviceProvider';
import {
  isCargoPrestadorId,
  resolveProviderCategories,
  validateProviderCategoriesForSubmit,
} from '@/utils/serviceProviderCategories';
import {
  buildServiceProviderUpdateBody,
  businessHoursFromApi,
  editFooterHint,
  isServiceProviderSuperAdmin,
} from '@/utils/serviceProviderForm';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function buildServiceAreaSummary(parts: {
  cep: string;
  locationName: string;
  locationAddress: string;
  streetNumber: string;
}): string {
  const lines: string[] = [];
  if (parts.cep.trim()) lines.push(`CEP ${parts.cep.trim()}`);
  if (parts.locationAddress.trim()) lines.push(parts.locationAddress.trim());
  if (parts.streetNumber.trim()) lines.push(`Nº/complemento: ${parts.streetNumber.trim()}`);
  if (parts.locationName.trim()) lines.push(`Bairro/região: ${parts.locationName.trim()}`);
  return lines.join(' · ');
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <LinearGradient colors={['#dbeafe', '#e0f2fe']} style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={20} color="#2563eb" />
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

export default function CadastroPrestadorScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ providerId?: string }>();
  const providerId = String(params.providerId ?? '').trim();
  const isEditMode = providerId.length > 0;
  const [displayName, setDisplayName] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<CargoPrestadorId[]>([]);
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [cep, setCep] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [providerStatus, setProviderStatus] = useState<ServiceProviderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const lastFetchedCepRef = useRef('');

  useEffect(() => {
    if (user?.name) setDisplayName((prev) => prev || user.name);
    if (user?.email) setEmail((prev) => prev || user.email);
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    setLoadingInitial(true);
    void getServiceProviderById(providerId)
      .then((provider) => {
        if (cancelled) return;
        const superAdmin = isServiceProviderSuperAdmin(user?.profile);
        if (!provider.isOwner && provider.userId !== user?.id && !superAdmin) {
          Alert.alert('Sem permissão', 'Você só pode editar o seu próprio cadastro de prestador.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
        setProviderStatus(provider.status);
        setDisplayName(provider.name ?? '');
        const loaded = resolveProviderCategories(provider).filter(isCargoPrestadorId);
        setSelectedCategoryIds(loaded);
        setCnpj(formatCnpjInput(provider.cnpj ?? ''));
        setPhone(formatBrazilPhoneInput(provider.phone ?? ''));
        setEmail(provider.email ?? '');
        setDescription(provider.description ?? '');
        setCep(formatCepDisplay(provider.cep ?? ''));
        setLocationName(provider.locationName ?? '');
        setLocationAddress(provider.locationAddress ?? '');
        setBusinessHours(businessHoursFromApi(provider.businessHours));
      })
      .catch((e) => {
        Alert.alert(
          'Não foi possível carregar',
          e instanceof Error ? e.message : 'Erro ao carregar cadastro para edição.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, providerId, user?.id, user?.profile]);

  const toggleProfession = (id: CargoPrestadorId) => {
    setSelectedCategoryIds((prev) => {
      const index = prev.indexOf(id);
      if (index >= 0) return prev.filter((item) => item !== id);
      return [...prev, id];
    });
  };

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

  const validate = (): string | null => {
    const cnpjDigits = cnpj.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');
    const cepDigits = cepDigitsOnly(cep);
    if (!displayName.trim()) return 'Informe seu nome ou nome fantasia.';
    if (!isEditMode && cnpjDigits.length !== 14) return 'Informe um CNPJ válido com 14 dígitos.';
    if (phoneDigits.length < 10) return 'Informe um telefone válido com DDD.';
    if (!email.trim() || !email.includes('@')) return 'Informe um e-mail válido.';
    const categoriesErr = validateProviderCategoriesForSubmit(selectedCategoryIds);
    if (categoriesErr) return categoriesErr;
    if (!description.trim()) return 'Descreva brevemente os serviços que você presta.';
    if (cepDigits.length !== 8) return 'Informe um CEP válido com 8 dígitos.';
    if (!locationName.trim()) return 'Informe o bairro ou região de atendimento.';
    if (!locationAddress.trim()) return 'Informe o endereço de atendimento.';
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Atenção', err);
      return;
    }
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para enviar seu cadastro.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entrar', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (user.profile === 'VISITANTE') {
      Alert.alert(
        'Conta necessária',
        'Visitantes não podem se cadastrar como prestador. Use uma conta cadastrada (cidadão).',
      );
      return;
    }

    const categories = [...selectedCategoryIds];

    const payload = {
      displayName: displayName.trim(),
      categories,
      cnpj: cnpj.trim(),
      phone: phone.trim(),
      email: email.trim(),
      description: description.trim(),
      serviceArea: buildServiceAreaSummary({
        cep,
        locationName,
        locationAddress,
        streetNumber,
      }),
      cep: cep.trim(),
      locationName: locationName.trim(),
      locationAddress: locationAddress.trim(),
      ...(streetNumber.trim() ? { streetNumber: streetNumber.trim() } : {}),
    };

    const cnpjDigits = cnpj.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');

    setLoading(true);
    try {
      if (isEditMode) {
        const updateBody = buildServiceProviderUpdateBody({
          name: payload.displayName,
          categories: payload.categories,
          description: payload.description,
          phoneDigits,
          email: payload.email,
          whatsappDigits: phoneDigits,
          cepDigits: cepDigitsOnly(cep),
          locationName: payload.locationName,
          locationAddress: payload.locationAddress,
          businessHoursText: businessHours,
        });
        await updateServiceProvider(providerId, updateBody);
        const savedMessage =
          providerStatus === 'APPROVED'
            ? 'Seus dados foram atualizados e continuam visíveis no guia.'
            : 'Seus dados foram salvos. O cadastro voltou para análise.';
        Alert.alert('Salvo', savedMessage, [
          { text: 'OK', onPress: () => router.replace(`/guia/${providerId}`) },
        ]);
      } else {
        const hoursPayload = businessHours.trim()
          ? { description: businessHours.trim() }
          : undefined;
        await createServiceProvider({
          type: 'INDIVIDUAL',
          name: payload.displayName,
          categories: payload.categories,
          cnpj: cnpjDigits,
          phone: phoneDigits,
          email: payload.email,
          description: payload.description,
          cep: cepDigitsOnly(cep),
          locationName: payload.locationName,
          locationAddress: payload.locationAddress,
          latitude: GUIA_DEFAULT_CENTER.latitude,
          longitude: GUIA_DEFAULT_CENTER.longitude,
          ...(hoursPayload ? { businessHours: hoursPayload } : {}),
        });
        router.replace('/guia?cadastroStatus=enviado');
      }
    } catch (e) {
      Alert.alert('Não foi possível enviar', e instanceof Error ? e.message : 'Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={[styles.flex, styles.loadingWrap]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados do cadastro…</Text>
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
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#2563eb', '#0ea5e9']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.9 }}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="person-add" size={26} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>
              {isEditMode ? 'Editar cadastro de prestador' : 'Cadastro de prestador'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isEditMode
                ? 'Atualize suas informações do Guia da Cidade.'
                : 'Envie seus dados para análise e inclusão no Guia da Cidade.'}
            </Text>
          </LinearGradient>

          <Section
            title="Dados principais"
            subtitle="Como seu perfil será exibido para os moradores"
            icon="person-outline"
          >
            <View style={styles.field}>
              <FieldLabel label="Nome ou nome fantasia" required />
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Como quer ser exibido no guia"
                placeholderTextColor={AppColors.text.quaternary}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Quais serviços você presta?" required />
              <Text style={styles.fieldHint}>
                Toque para marcar vários. A primeira selecionada aparece em destaque no guia.
              </Text>
              <View style={styles.chipsRow}>
                {CARGOS_PRESTADORES.map((c) => {
                  const active = selectedCategoryIds.includes(c.id);
                  const isPrimary = selectedCategoryIds[0] === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                        isPrimary && styles.chipPrimary,
                      ]}
                      onPress={() => toggleProfession(c.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {c.label}
                        {isPrimary ? ' ★' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <FieldLabel label="CNPJ" required={!isEditMode} />
              <TextInput
                style={[styles.input, isEditMode && styles.inputReadOnly]}
                value={cnpj}
                onChangeText={(text) => setCnpj(formatCnpjInput(text))}
                placeholder="00.000.000/0000-00"
                placeholderTextColor={AppColors.text.quaternary}
                keyboardType="number-pad"
                maxLength={18}
                editable={!isEditMode}
              />
              {isEditMode ? (
                <Text style={styles.fieldHint}>
                  O CNPJ não pode ser alterado após o cadastro.
                </Text>
              ) : null}
            </View>
          </Section>

          <Section
            title="Contato e atendimento"
            subtitle="Telefone, e-mail e local onde você atende"
            icon="call-outline"
          >
            <View style={styles.field}>
              <FieldLabel label="Telefone (WhatsApp se possível)" required />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => setPhone(formatBrazilPhoneInput(text))}
                placeholder="(21) 99999-9999"
                placeholderTextColor={AppColors.text.quaternary}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="E-mail" required />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={AppColors.text.quaternary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="CEP da área de atendimento" required />
              <View style={styles.cepRow}>
                <TextInput
                  style={[styles.input, styles.cepInput]}
                  value={cep}
                  onChangeText={handleCepChange}
                  placeholder="00000-000"
                  placeholderTextColor={AppColors.text.quaternary}
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
                    <ActivityIndicator size="small" color="#2563eb" />
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
                <Text style={styles.fieldHint}>
                  O endereço é preenchido automaticamente ao digitar o CEP completo.
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
              <FieldLabel label="Endereço" required />
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
              <FieldLabel label="Número / complemento (opcional)" />
              <TextInput
                style={styles.input}
                value={streetNumber}
                onChangeText={setStreetNumber}
                placeholder="Ex.: 100, apto 12"
                placeholderTextColor={AppColors.text.quaternary}
                maxLength={80}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Horário de atendimento (opcional)" />
              <TextInput
                style={styles.input}
                value={businessHours}
                onChangeText={setBusinessHours}
                placeholder="Ex.: Seg a Sex, 8h às 18h"
                placeholderTextColor={AppColors.text.quaternary}
              />
            </View>
          </Section>

          <Section
            title="Descrição profissional"
            subtitle="Conte sua experiência e os tipos de serviço que oferece"
            icon="document-text-outline"
          >
            <View style={styles.field}>
              <FieldLabel label="Descrição dos serviços" required />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex.: manutenção elétrica residencial, instalações e emergências."
                placeholderTextColor={AppColors.text.quaternary}
                multiline
                textAlignVertical="top"
              />
            </View>
          </Section>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            onPress={() => void onSubmit()}
            disabled={loading}
            style={({ pressed }) => [pressed && styles.submitPressed]}
          >
            <LinearGradient
              colors={loading ? ['#93c5fd', '#7dd3fc'] : ['#2563eb', '#0ea5e9']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>
                    {isEditMode ? 'Salvar alterações' : 'Enviar cadastro'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={styles.footerHint}>
            {isEditMode
              ? editFooterHint(providerStatus)
              : 'A solicitação pode passar por validação antes de aparecer no guia.'}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  hero: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 2,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    maxWidth: 280,
  },
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
  required: { color: '#2563eb' },
  fieldHint: {
    fontSize: 12,
    fontWeight: '600',
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
  cepFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  cepFeedbackOk: { color: '#059669' },
  cepFeedbackErr: { color: AppColors.status.error },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.text.primary,
    backgroundColor: '#f8fafc',
  },
  inputReadOnly: {
    backgroundColor: '#f1f5f9',
    color: AppColors.text.secondary,
  },
  textArea: { minHeight: 110, paddingTop: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColors.background.light,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipPrimary: {
    borderWidth: 2,
    borderColor: '#1d4ed8',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: AppColors.gray[700] },
  chipTextActive: { color: '#fff' },
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
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitPressed: { opacity: 0.92 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  footerHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.text.quaternary,
    lineHeight: 16,
  },
});
