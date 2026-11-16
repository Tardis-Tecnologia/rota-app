import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import {
  COURSE_MODALITY_LABEL,
  COURSE_STATUS_LABEL,
  enrollInCourse,
  getCourse,
  uploadCourseDocumentFromUri,
  type Course,
  type CourseClass,
  type CourseEnrollment,
} from '@/services/educationApi';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const STEPS = ['Dados', 'Turma', 'Documentos', 'Confirmar'] as const;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCpf(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

type UploadedDoc = { uri: string; name: string; url?: string; uploading?: boolean };

export default function CourseEnrollScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isVisitante = useIsVisitante();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [classId, setClassId] = useState('');
  const [notes, setNotes] = useState('');
  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [applicantCpf, setApplicantCpf] = useState('');
  const [applicantRg, setApplicantRg] = useState('');
  const [docFiles, setDocFiles] = useState<Record<string, UploadedDoc | undefined>>({});
  const [result, setResult] = useState<CourseEnrollment | null>(null);

  useEffect(() => {
    if (isVisitante) {
      promptVisitanteLogin('se inscrever em cursos');
      router.back();
      return;
    }
    let active = true;
    (async () => {
      try {
        const c = await getCourse(id!);
        if (!active) return;
        setCourse(c);
        const firstOpen = c.classes?.find((k) => k.seatsLeft > 0 || k.waitlistEnabled);
        setClassId(firstOpen?.id || c.classes?.[0]?.id || '');
      } catch (e) {
        Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao carregar');
        router.back();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isVisitante]);

  const selectedClass: CourseClass | undefined = useMemo(
    () => course?.classes?.find((c) => c.id === classId),
    [course, classId],
  );

  const requiredDocs = course?.requiredDocuments ?? [];

  const canNext = () => {
    if (step === 0) {
      return (
        applicantName.trim().length >= 3 &&
        digitsOnly(applicantCpf).length === 11 &&
        applicantRg.trim().length >= 3
      );
    }
    if (step === 1) return !!classId;
    if (step === 2) {
      return requiredDocs.every((doc) => Boolean(docFiles[doc]?.url));
    }
    return true;
  };

  const pickDocument = async (docName: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Permita acesso à galeria para enviar o documento.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    const asset = picked.assets[0];
    setDocFiles((prev) => ({
      ...prev,
      [docName]: {
        uri: asset.uri,
        name: asset.fileName || `${docName}.jpg`,
        uploading: true,
      },
    }));
    try {
      const uploaded = await uploadCourseDocumentFromUri(asset.uri, {
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `${docName.replace(/\s+/g, '-').toLowerCase()}.jpg`,
      });
      setDocFiles((prev) => ({
        ...prev,
        [docName]: {
          uri: asset.uri,
          name: asset.fileName || `${docName}.jpg`,
          url: uploaded.publicUrl,
          uploading: false,
        },
      }));
    } catch (e) {
      setDocFiles((prev) => ({ ...prev, [docName]: undefined }));
      Alert.alert('Upload', e instanceof Error ? e.message : 'Não foi possível enviar o arquivo');
    }
  };

  const submit = async () => {
    if (!course || !classId) return;
    setSubmitting(true);
    try {
      const documents = requiredDocs
        .map((doc) => {
          const file = docFiles[doc];
          if (!file?.url) return null;
          return { name: doc, kind: doc, url: file.url };
        })
        .filter((d): d is { name: string; kind: string; url: string } => !!d);

      const enrollment = await enrollInCourse(course.id, {
        classId,
        applicantName: applicantName.trim(),
        applicantCpf: digitsOnly(applicantCpf),
        applicantRg: applicantRg.trim(),
        notes: notes.trim() || undefined,
        documents: documents.length ? documents : undefined,
      });
      setResult(enrollment);
    } catch (e) {
      Alert.alert('Inscrição', e instanceof Error ? e.message : 'Não foi possível concluir');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !course) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={AppColors.primary} />;
  }

  if (result) {
    return (
      <View style={styles.successWrap}>
        <Stack.Screen options={{ title: 'Inscrição enviada' }} />
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={52} color="#047857" />
          <Text style={styles.successTitle}>Inscrição registrada</Text>
          <Text style={styles.successText}>
            Protocolo {result.protocol}. Situação: {COURSE_STATUS_LABEL[result.status]}.
          </Text>
          <Text style={styles.successHint}>
            A matrícula só é confirmada após análise da prefeitura. Depois do aceite, os avisos
            do curso aparecem em Minhas inscrições.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              router.replace(`/education/cursos/inscricoes/${result.id}` as Href)
            }
          >
            <Text style={styles.primaryBtnText}>Acompanhar inscrição</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.replace('/education/cursos' as Href)}
          >
            <Text style={styles.secondaryBtnText}>Voltar aos cursos</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Inscrição' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.steps}>
          {STEPS.map((label, index) => (
            <View key={label} style={[styles.step, index === step && styles.stepActive]}>
              <Text style={[styles.stepText, index === step && styles.stepTextActive]}>
                {index + 1}. {label}
              </Text>
            </View>
          ))}
        </View>

        {step === 0 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Seus dados</Text>
            <Text style={styles.hint}>Digite os dados do candidato. Não use link de arquivo.</Text>
            <Text style={styles.docLabel}>Nome completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor={AppColors.text.quaternary}
              value={applicantName}
              onChangeText={setApplicantName}
              autoCapitalize="words"
            />
            <Text style={styles.docLabel}>CPF</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor={AppColors.text.quaternary}
              value={applicantCpf}
              onChangeText={(t) => setApplicantCpf(formatCpf(t))}
              keyboardType="number-pad"
              maxLength={14}
            />
            <Text style={styles.docLabel}>RG</Text>
            <TextInput
              style={styles.input}
              placeholder="Número do RG"
              placeholderTextColor={AppColors.text.quaternary}
              value={applicantRg}
              onChangeText={setApplicantRg}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              multiline
              placeholder="Observações (opcional)"
              placeholderTextColor={AppColors.text.quaternary}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Escolha a turma</Text>
            {(course.classes ?? []).map((klass) => {
              const full = klass.seatsLeft <= 0 && !klass.waitlistEnabled;
              return (
                <Pressable
                  key={klass.id}
                  style={[
                    styles.option,
                    classId === klass.id && styles.optionActive,
                    full && styles.optionDisabled,
                  ]}
                  disabled={full}
                  onPress={() => setClassId(klass.id)}
                >
                  <Text style={styles.optionTitle}>{klass.name}</Text>
                  <Text style={styles.optionMeta}>
                    {[klass.shift, klass.schedule].filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={styles.optionMeta}>
                    {full
                      ? 'Sem vagas'
                      : klass.seatsLeft <= 0
                        ? 'Lista de espera'
                        : `${klass.seatsLeft} vagas`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Documentos para upload</Text>
            {requiredDocs.length === 0 ? (
              <Text style={styles.hint}>
                Este curso não exige anexos. CPF, RG e nome já foram informados.
              </Text>
            ) : (
              requiredDocs.map((doc) => {
                const file = docFiles[doc];
                return (
                  <View key={doc} style={styles.docBlock}>
                    <Text style={styles.docLabel}>{doc}</Text>
                    <Pressable
                      style={styles.uploadBtn}
                      onPress={() => void pickDocument(doc)}
                      disabled={file?.uploading}
                    >
                      <Ionicons
                        name={file?.url ? 'checkmark-circle' : 'cloud-upload-outline'}
                        size={18}
                        color={file?.url ? '#047857' : AppColors.primary}
                      />
                      <Text style={styles.uploadText}>
                        {file?.uploading
                          ? 'Enviando…'
                          : file?.url
                            ? 'Arquivo enviado — trocar'
                            : 'Selecionar e enviar arquivo'}
                      </Text>
                    </Pressable>
                    {file?.name && !file.uploading ? (
                      <Text style={styles.hint}>{file.name}</Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Resumo</Text>
            <Text style={styles.value}>Curso: {course.title}</Text>
            <Text style={styles.value}>
              Modalidade: {COURSE_MODALITY_LABEL[course.modality]}
            </Text>
            <Text style={styles.value}>Turma: {selectedClass?.name}</Text>
            <Text style={styles.value}>Nome: {applicantName.trim()}</Text>
            <Text style={styles.value}>CPF: {applicantCpf}</Text>
            <Text style={styles.value}>RG: {applicantRg.trim()}</Text>
            {requiredDocs.length ? (
              <Text style={styles.value}>{requiredDocs.length} arquivo(s) anexado(s)</Text>
            ) : null}
            <Text style={styles.hint}>
              Ao confirmar, a inscrição será registrada com protocolo. A matrícula não é
              automática.
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {step > 0 ? (
            <Pressable style={styles.secondaryBtn} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.secondaryBtnText}>Voltar</Text>
            </Pressable>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Pressable
              style={[styles.primaryBtn, !canNext() && styles.disabled]}
              disabled={!canNext()}
              onPress={() => setStep((s) => s + 1)}
            >
              <Text style={styles.primaryBtnText}>Continuar</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryBtn, submitting && styles.disabled]}
              disabled={submitting}
              onPress={() => void submit()}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? 'Enviando…' : 'Confirmar inscrição'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
    marginBottom: 12,
  },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  step: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  stepActive: { backgroundColor: AppColors.primary },
  stepText: { fontSize: 11, fontWeight: '700', color: AppColors.text.tertiary },
  stepTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '800', color: AppColors.text.secondary },
  value: { fontSize: 14, color: AppColors.text.tertiary },
  hint: { fontSize: 12, lineHeight: 18, color: AppColors.text.quaternary },
  input: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: AppColors.text.secondary,
    backgroundColor: AppColors.background.default,
  },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  optionActive: { borderColor: AppColors.primary, backgroundColor: '#eff6ff' },
  optionDisabled: { opacity: 0.45 },
  optionTitle: { fontWeight: '800', color: AppColors.text.secondary },
  optionMeta: { marginTop: 2, fontSize: 12, color: AppColors.text.tertiary },
  docLabel: { fontSize: 13, fontWeight: '700', color: AppColors.text.secondary, marginTop: 6 },
  docBlock: { marginBottom: 8 },
  uploadBtn: {
    marginTop: 6,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: { color: AppColors.text.secondary, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryBtn: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  secondaryBtnText: { color: AppColors.text.secondary, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  successWrap: { flex: 1, justifyContent: 'center', padding: 16 },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  successText: {
    marginTop: 8,
    textAlign: 'center',
    color: AppColors.text.tertiary,
    lineHeight: 20,
  },
  successHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.text.quaternary,
  },
});
