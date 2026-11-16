import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMyJobCandidateProfile,
  uploadMyJobResumePdf,
  upsertMyJobCandidateProfile,
  type JobCandidateProfileInput,
  type JobCandidateResumeFile,
} from '@/services/jobsApi';
import { formatBrazilPhoneInput } from '@/utils/phoneMask';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const EDUCATION_OPTIONS = [
  'Ensino fundamental',
  'Ensino médio incompleto',
  'Ensino médio completo',
  'Ensino superior incompleto',
  'Ensino superior completo',
  'Pós-graduação',
];

export default function JobCandidateProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ jobId?: string; returnToApply?: string }>();
  const returnJobId = String(params.jobId ?? '').trim();
  const returnToApply = String(params.returnToApply ?? '') === '1';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('Maricá');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [educationLevel, setEducationLevel] = useState('Ensino médio completo');
  const [courseOrArea, setCourseOrArea] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [about, setAbout] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<JobCandidateResumeFile | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getMyJobCandidateProfile();
      if (profile) {
        setFullName(profile.fullName || user?.name || '');
        setEmail(profile.email || user?.email || '');
        setPhone(formatBrazilPhoneInput(profile.phone || ''));
        setCpf(profile.cpf || '');
        setBirthDate(profile.birthDate || '');
        setCity(profile.city || 'Maricá');
        setNeighborhood(profile.neighborhood || '');
        setAddress(profile.address || '');
        setEducationLevel(profile.educationLevel || 'Ensino médio completo');
        setCourseOrArea(profile.courseOrArea || '');
        setExperienceSummary(profile.experienceSummary || '');
        setSkillsText((profile.skills || []).join(', '));
        setAbout(profile.about || '');
        setLinkedinUrl(profile.linkedinUrl || '');
        setResumeFile(profile.resumeFile ?? null);
      }
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível carregar o perfil.');
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.name]);

  const onPickResumePdf = useCallback(async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]?.uri) return;
      const asset = picked.assets[0];
      setUploadingResume(true);
      const saved = await uploadMyJobResumePdf({
        uri: asset.uri,
        fileName: asset.name || 'curriculo.pdf',
        mimeType: asset.mimeType || 'application/pdf',
      });
      setResumeFile(saved.resumeFile ?? null);
      Alert.alert('Currículo anexado', 'O PDF foi enviado com sucesso.');
    } catch (e) {
      Alert.alert(
        'PDF do currículo',
        e instanceof Error ? e.message : 'Não foi possível anexar o arquivo.',
      );
    } finally {
      setUploadingResume(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    const skills = skillsText
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const input: JobCandidateProfileInput = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, ''),
      cpf: cpf.replace(/\D/g, '') || undefined,
      birthDate: birthDate.trim() || undefined,
      city: city.trim(),
      neighborhood: neighborhood.trim() || undefined,
      address: address.trim() || undefined,
      educationLevel: educationLevel.trim(),
      courseOrArea: courseOrArea.trim() || undefined,
      experienceSummary: experienceSummary.trim(),
      skills,
      about: about.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
    };

    if (!input.fullName || !input.email || input.phone.length < 10) {
      Alert.alert('Perfil incompleto', 'Preencha nome, e-mail e telefone válidos.');
      return;
    }
    if (!input.city || !input.educationLevel) {
      Alert.alert('Perfil incompleto', 'Informe cidade e escolaridade.');
      return;
    }
    if (input.experienceSummary.length < 20) {
      Alert.alert(
        'Perfil incompleto',
        'Descreva sua experiência com pelo menos 20 caracteres.',
      );
      return;
    }
    if (skills.length === 0) {
      Alert.alert('Perfil incompleto', 'Informe ao menos uma habilidade.');
      return;
    }

    setSaving(true);
    try {
      const saved = await upsertMyJobCandidateProfile(input);
      if (!saved.isComplete) {
        Alert.alert(
          'Quase lá',
          `Ainda faltam: ${saved.missingFields.join(', ')}`,
        );
        return;
      }
      Alert.alert(
        'Perfil salvo',
        returnToApply
          ? 'Currículo completo. Agora você pode enviar a candidatura.'
          : 'Seu perfil profissional está completo.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (returnJobId) {
                router.replace({
                  pathname: '/JobDetailTab',
                  params: {
                    jobId: returnJobId,
                    ...(returnToApply ? { readyToApply: '1' } : {}),
                  },
                });
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/JobsTab');
              }
            },
          },
        ],
      );
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/JobsTab'))}
          hitSlop={10}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color={AppColors.text.secondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Perfil profissional</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Preencha seus dados completos para se candidatar às vagas pelo app.
          </Text>

          <Field label="Nome completo" required>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          </Field>
          <Field label="E-mail" required>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>
          <Field label="Telefone / WhatsApp" required>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => setPhone(formatBrazilPhoneInput(t))}
              keyboardType="phone-pad"
            />
          </Field>
          <Field label="CPF">
            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={setCpf}
              keyboardType="number-pad"
              maxLength={11}
              placeholder="Somente números"
              placeholderTextColor="#94a3b8"
            />
          </Field>
          <Field label="Data de nascimento">
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#94a3b8"
            />
          </Field>
          <Field label="Cidade" required>
            <TextInput style={styles.input} value={city} onChangeText={setCity} />
          </Field>
          <Field label="Bairro">
            <TextInput
              style={styles.input}
              value={neighborhood}
              onChangeText={setNeighborhood}
            />
          </Field>
          <Field label="Endereço">
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
          </Field>

          <Text style={styles.sectionLabel}>Escolaridade</Text>
          <View style={styles.chips}>
            {EDUCATION_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setEducationLevel(opt)}
                style={[styles.chip, educationLevel === opt && styles.chipActive]}
              >
                <Text style={[styles.chipText, educationLevel === opt && styles.chipTextActive]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field label="Curso / área">
            <TextInput
              style={styles.input}
              value={courseOrArea}
              onChangeText={setCourseOrArea}
              placeholder="Ex.: Administração, TI..."
              placeholderTextColor="#94a3b8"
            />
          </Field>
          <Field label="Experiência profissional" required>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={experienceSummary}
              onChangeText={setExperienceSummary}
              multiline
              placeholder="Conte sua trajetória, empresas e principais atividades..."
              placeholderTextColor="#94a3b8"
            />
          </Field>
          <Field label="Habilidades (separadas por vírgula)" required>
            <TextInput
              style={styles.input}
              value={skillsText}
              onChangeText={setSkillsText}
              placeholder="Ex.: Excel, atendimento, React"
              placeholderTextColor="#94a3b8"
            />
          </Field>
          <Field label="Sobre você">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={about}
              onChangeText={setAbout}
              multiline
            />
          </Field>
          <Field label="LinkedIn">
            <TextInput
              style={styles.input}
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              autoCapitalize="none"
              placeholder="https://linkedin.com/in/..."
              placeholderTextColor="#94a3b8"
            />
          </Field>

          <Text style={styles.sectionLabel}>Currículo em PDF</Text>
          <Text style={styles.resumeHint}>
            Anexe seu currículo completo em PDF. Salve o perfil antes, se ainda não salvou.
          </Text>
          {resumeFile ? (
            <View style={styles.resumeCard}>
              <Ionicons name="document-text" size={22} color="#6d28d9" />
              <View style={styles.resumeMeta}>
                <Text style={styles.resumeName} numberOfLines={1}>
                  {resumeFile.fileName || 'curriculo.pdf'}
                </Text>
                <Text style={styles.resumeStatus}>PDF anexado</Text>
              </View>
              {resumeFile.publicUrl ? (
                <Pressable
                  onPress={() => void Linking.openURL(resumeFile.publicUrl!)}
                  hitSlop={8}
                  style={styles.resumeOpenBtn}
                >
                  <Ionicons name="open-outline" size={18} color="#6d28d9" />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <Pressable
            onPress={() => void onPickResumePdf()}
            disabled={uploadingResume}
            style={({ pressed }) => [
              styles.resumePickBtn,
              pressed && { opacity: 0.9 },
              uploadingResume && { opacity: 0.7 },
            ]}
          >
            {uploadingResume ? (
              <ActivityIndicator color="#6d28d9" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#6d28d9" />
                <Text style={styles.resumePickText}>
                  {resumeFile ? 'Trocar PDF do currículo' : 'Adicionar PDF do currículo'}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            onPress={() => void onSave()}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.9 },
              saving && { opacity: 0.7 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Salvar perfil completo</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background.default },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 48,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  content: { padding: 16, gap: 12 },
  intro: { fontSize: 14, color: AppColors.text.tertiary, lineHeight: 20, marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: AppColors.text.secondary },
  required: { color: '#dc2626' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: AppColors.text.secondary,
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  sectionLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#ede9fe', borderColor: '#7c3aed' },
  chipText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#6d28d9' },
  resumeHint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
    marginTop: -4,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  resumeMeta: { flex: 1, gap: 2 },
  resumeName: { fontSize: 14, fontWeight: '700', color: AppColors.text.secondary },
  resumeStatus: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  resumeOpenBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
  },
  resumePickBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  resumePickText: { fontSize: 14, fontWeight: '700', color: '#6d28d9' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
