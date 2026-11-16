import { AppColors } from '@/constants/theme';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import {
  COURSE_MODALITY_LABEL,
  COURSE_STATUS_LABEL,
  getCourse,
  resolveCourseImageSource,
  type Course,
} from '@/services/educationApi';
import { isoDateToBr } from '@/services/publicServicesHttp';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

function Section({ title, body }: { title: string; body?: string | null }) {
  if (!body?.trim()) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isVisitante = useIsVisitante();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setCourse(await getCourse(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar curso');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={AppColors.primary} />;
  }
  if (error || !course) {
    return <Text style={styles.error}>{error || 'Curso não encontrado'}</Text>;
  }

  const canEnroll = course.enrollmentOpenNow && !course.enrolled;
  const cover = resolveCourseImageSource(course);

  return (
    <>
      <Stack.Screen options={{ title: course.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={cover} style={styles.hero} />

        <Text style={styles.eyebrow}>
          {course.categoryName || course.category || 'Curso municipal'}
        </Text>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.lead}>
          {course.summary || course.description || 'Oferta da prefeitura'}
        </Text>

        <View style={styles.infoGrid}>
          <Info label="Modalidade" value={COURSE_MODALITY_LABEL[course.modality]} />
          <Info label="Instituição" value={course.institution} />
          <Info label="Local" value={course.location || course.address} />
          <Info label="Bairro" value={course.neighborhood} />
          <Info
            label="Carga horária"
            value={course.workloadHours ? `${course.workloadHours} horas` : null}
          />
          <Info label="Turno" value={course.shift} />
          <Info
            label="Período"
            value={
              course.startDate
                ? `${isoDateToBr(course.startDate)}${course.endDate ? ` a ${isoDateToBr(course.endDate)}` : ''}`
                : null
            }
          />
          <Info label="Horário" value={course.schedule} />
          <Info
            label="Inscrições"
            value={
              course.enrollmentOpenNow
                ? 'Abertas'
                : course.registrationOpen
                  ? 'Fora do período'
                  : 'Encerradas'
            }
          />
          {course.showVacancies ? (
            <Info label="Vagas" value={`${course.seatsLeft} de ${course.seats}`} />
          ) : null}
          {course.minAge != null ? <Info label="Idade mínima" value={`${course.minAge} anos`} /> : null}
        </View>

        <Section title="Sobre o curso" body={course.fullDescription || course.description} />
        <Section title="Conteúdo programático" body={course.syllabus} />
        <Section title="Objetivos" body={course.objectives} />
        <Section title="Público-alvo" body={course.targetAudience} />
        <Section title="Pré-requisitos" body={course.prerequisites} />
        <Section title="Certificado" body={course.certificateInfo} />

        {course.requiredDocuments?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documentos necessários</Text>
            {course.requiredDocuments.map((doc) => (
              <Text key={doc} style={styles.bullet}>
                • {doc}
              </Text>
            ))}
          </View>
        ) : null}

        {course.classes?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Turmas</Text>
            {course.classes.map((klass) => (
              <View key={klass.id} style={styles.classCard}>
                <Text style={styles.className}>{klass.name}</Text>
                <Text style={styles.classMeta}>
                  {[klass.shift, klass.schedule].filter(Boolean).join(' · ')}
                </Text>
                {course.showVacancies ? (
                  <Text style={styles.classMeta}>
                    {klass.seatsLeft} vagas
                    {klass.waitlistEnabled ? ' · lista de espera' : ''}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {course.enrolled && course.myEnrollmentId ? (
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              router.push(`/education/cursos/inscricoes/${course.myEnrollmentId}` as Href)
            }
          >
            <Text style={styles.secondaryBtnText}>
              Ver inscrição
              {course.myEnrollmentStatus
                ? ` · ${COURSE_STATUS_LABEL[course.myEnrollmentStatus]}`
                : ''}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.primaryBtn, !canEnroll && styles.disabled]}
          disabled={!canEnroll && !isVisitante}
          onPress={() => {
            if (isVisitante) {
              promptVisitanteLogin('se inscrever em cursos');
              return;
            }
            if (!canEnroll) return;
            router.push(`/education/cursos/${course.id}/inscrever` as Href);
          }}
        >
          <Text style={styles.primaryBtnText}>
            {course.enrolled
              ? 'Você já possui inscrição'
              : course.enrollmentOpenNow
                ? 'Inscrever-se no curso'
                : 'Inscrições indisponíveis'}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  hero: { width: '100%', height: 200, backgroundColor: AppColors.primary },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  eyebrow: {
    marginTop: 16,
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
  },
  title: {
    marginHorizontal: 16,
    marginTop: 6,
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  lead: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.text.tertiary,
  },
  infoGrid: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  infoItem: { gap: 2 },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.text.quaternary,
    textTransform: 'uppercase',
  },
  infoValue: { fontSize: 14, fontWeight: '600', color: AppColors.text.secondary },
  section: { marginTop: 18, marginHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.text.secondary,
    marginBottom: 6,
  },
  sectionBody: { fontSize: 14, lineHeight: 21, color: AppColors.text.tertiary },
  bullet: { fontSize: 14, color: AppColors.text.tertiary, marginTop: 4 },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  className: { fontWeight: '800', color: AppColors.text.secondary },
  classMeta: { marginTop: 2, fontSize: 13, color: AppColors.text.tertiary },
  primaryBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  secondaryBtnText: { color: AppColors.primary, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  error: { margin: 16, color: '#b91c1c' },
});
