import type { JobCard } from '@/components/JobsOpportunities';
import { jobsNearBy } from '@/components/JobsOpportunities';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  applyToJob,
  getJobById,
  getMyJobCandidateProfile,
  type JobListing,
} from '@/services/jobsApi';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function mapApiJobToCard(job: JobListing): JobCard {
  const workType = (job.workType as JobCard['type']) || 'Presencial';
  return {
    id: job.id,
    title: job.title,
    company: job.company?.name || job.companyName,
    location: job.location,
    type: ['Remoto', 'Presencial', 'Híbrido'].includes(workType)
      ? workType
      : 'Presencial',
    contractType: (job.contractType as JobCard['contractType']) || 'CLT',
    salary: job.salaryLabel,
    image: job.imageUrl || job.companyPhotoUrl || job.company?.photoUrl || '',
    distance: 0,
    description: job.description,
    requirements: job.requirements,
    commercialAccountId: job.commercialAccountId ?? job.company?.commercialAccountId,
    companyPhotoUrl: job.companyPhotoUrl ?? job.company?.photoUrl,
    deadlineLabel: job.deadlineLabel,
  };
}

export default function JobDetailTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { jobId, readyToApply } = useLocalSearchParams<{
    jobId?: string;
    readyToApply?: string;
  }>();
  const requestedId = String(jobId ?? '').trim();

  const [job, setJob] = useState<JobCard | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (requestedId) {
        const fromApi = await getJobById(requestedId);
        if (fromApi) {
          setJob(mapApiJobToCard(fromApi));
          setAlreadyApplied(!!fromApi.alreadyApplied);
          return;
        }
      }
      const mock = jobsNearBy.find((j) => j.id === requestedId) ?? jobsNearBy[0];
      setJob(mock);
      setAlreadyApplied(false);
    } catch {
      const mock = jobsNearBy.find((j) => j.id === requestedId) ?? jobsNearBy[0];
      setJob(mock);
      setAlreadyApplied(false);
    } finally {
      setLoading(false);
    }
  }, [requestedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCompanyProfile = useCallback(() => {
    if (!job?.commercialAccountId?.trim()) {
      Alert.alert(
        'Perfil da empresa',
        `${job?.company ?? 'Empresa'}\n${job?.location ?? ''}\n\nEsta vaga ainda não tem perfil público vinculado.`,
      );
      return;
    }
    router.push({
      pathname: '/forum/store',
      params: {
        commercialId: job.commercialAccountId,
        storeName: job.company,
        photoUrl: job.companyPhotoUrl ?? '',
      },
    });
  }, [job]);

  const isApiJobId = useCallback((id: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id.trim(),
    );
  }, []);

  const goFillProfile = useCallback(
    (targetJobId: string) => {
      router.push({
        pathname: '/JobCandidateProfile',
        params: { jobId: targetJobId, returnToApply: '1' },
      });
    },
    [],
  );

  const submitApplication = useCallback(async () => {
    if (!job?.id) return;
    if (!isApiJobId(job.id)) {
      Alert.alert(
        'Vaga indisponível',
        'Esta vaga ainda não está publicada no servidor. Volte à lista e atualize as oportunidades.',
      );
      return;
    }
    setApplying(true);
    try {
      await applyToJob(job.id);
      setAlreadyApplied(true);
      Alert.alert(
        'Candidatura enviada',
        'Sua candidatura foi registrada no sistema. A empresa poderá analisar seu perfil.',
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Tente novamente em instantes.';
      if (/perfil|complete|incomplet/i.test(message)) {
        goFillProfile(job.id);
        return;
      }
      Alert.alert('Não foi possível candidatar', message);
    } finally {
      setApplying(false);
    }
  }, [goFillProfile, isApiJobId, job?.id]);

  const onApply = useCallback(async () => {
    if (!job || applying) return;
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para se candidatar a esta vaga.');
      return;
    }
    if (user.profile === 'VISITANTE') {
      promptVisitanteLogin('se candidatar a vagas');
      return;
    }
    if (alreadyApplied) {
      Alert.alert('Candidatura enviada', 'Você já se candidatou a esta vaga.');
      return;
    }

    if (!isApiJobId(job.id)) {
      Alert.alert(
        'Atualize a lista',
        'As vagas reais da cidade precisam ser carregadas do servidor. Volte e puxe para atualizar em Oportunidades.',
      );
      return;
    }

    setApplying(true);
    try {
      const profile = await getMyJobCandidateProfile();
      if (!profile || !profile.isComplete) {
        setApplying(false);
        goFillProfile(job.id);
        return;
      }

      setApplying(false);
      Alert.alert(
        'Enviar candidatura',
        `Confirmar envio do seu perfil para a vaga "${job.title}" em ${job.company}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar',
            onPress: () => void submitApplication(),
          },
        ],
      );
    } catch (e) {
      setApplying(false);
      const message = e instanceof Error ? e.message : 'Falha ao verificar seu perfil.';
      // Sem perfil ainda (404/erro) → ir direto ao formulário.
      if (/404|não encontr|not found|perfil/i.test(message) || message.includes('HTTP 404')) {
        goFillProfile(job.id);
        return;
      }
      Alert.alert('Erro', message);
    }
  }, [alreadyApplied, applying, goFillProfile, isApiJobId, job, submitApplication, user]);

  useEffect(() => {
    if (readyToApply !== '1' || !job || loading || alreadyApplied || applying) return;
    router.setParams({ readyToApply: undefined });
    const timer = setTimeout(() => {
      void submitApplication();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retorno do formulário de perfil
  }, [readyToApply, job?.id, loading, alreadyApplied]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/JobsTab');
  };

  const companyLogo = useMemo(
    () => job?.companyPhotoUrl || job?.image || '',
    [job?.companyPhotoUrl, job?.image],
  );

  if (loading || !job) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={16}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
        </Pressable>
        <Pressable
          hitSlop={12}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Ionicons name="share-outline" size={24} color={AppColors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={{ uri: job.image }}
          style={styles.heroImage}
          imageStyle={styles.heroImageStyle}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="briefcase-outline" size={14} color={AppColors.text.white} />
              <Text style={styles.heroBadgeText}>{job.contractType ?? 'CLT'}</Text>
            </View>
            <Text style={styles.heroTitle}>{job.title}</Text>
          </View>
        </ImageBackground>

        <View style={styles.card}>
          <Pressable
            onPress={openCompanyProfile}
            style={({ pressed }) => [styles.companyRow, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${job.company}`}
          >
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={styles.companyLogo} />
            ) : (
              <View style={[styles.companyLogo, styles.companyLogoFallback]}>
                <Ionicons name="business-outline" size={22} color="#64748b" />
              </View>
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{job.company}</Text>
              <Text style={styles.companyLocation}>{job.location}</Text>
              <Text style={styles.companyProfileLink}>
                {job.commercialAccountId ? 'Ver perfil da empresa' : 'Dados da empresa'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {alreadyApplied ? 'CANDIDATURA ENVIADA' : 'ABERTO'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PROVENTO</Text>
              <Text style={styles.statValue}>{job.salary}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, styles.statLabelPink]}>PRAZO FINAL</Text>
              <Text style={styles.statValue}>{job.deadlineLabel || 'Imediato'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>Visão Geral</Text>
            <Text style={styles.sectionText}>
              {job.description ?? 'Descrição da vaga em breve.'}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionBar, styles.sectionBarGreen]} />
            <Text style={styles.sectionTitle}>O que você precisa</Text>
            <View style={styles.requirementsList}>
              {(job.requirements ?? ['Requisitos em breve.']).map((req, i) => (
                <View key={`${req}-${i}`} style={styles.requirementItem}>
                  <View style={styles.requirementIcon}>
                    <Ionicons name="shield-checkmark" size={18} color={AppColors.text.white} />
                  </View>
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaFixed, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => void onApply()}
          disabled={applying || alreadyApplied}
          style={({ pressed }) => [
            styles.ctaButton,
            alreadyApplied && styles.ctaButtonDone,
            pressed && !alreadyApplied && styles.ctaButtonPressed,
            applying && { opacity: 0.75 },
          ]}
        >
          {applying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={alreadyApplied ? 'checkmark-circle' : 'person-add-outline'}
                size={22}
                color={AppColors.text.white}
              />
              <Text style={styles.ctaButtonText}>
                {alreadyApplied ? 'CANDIDATURA ENVIADA' : 'CANDIDATAR-SE À VAGA'}
              </Text>
              {!alreadyApplied ? (
                <Ionicons name="arrow-forward" size={20} color={AppColors.text.white} />
              ) : null}
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: { opacity: 0.8 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  heroImage: { height: 220, justifyContent: 'flex-end', padding: 20 },
  heroImageStyle: { resizeMode: 'cover' },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  heroContent: { gap: 12, paddingBottom: 28 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.palette.purple.base,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  heroBadgeText: { fontSize: 13, fontWeight: '700', color: AppColors.text.white },
  heroTitle: { fontSize: 22, fontWeight: '700', color: AppColors.text.white },
  card: {
    marginHorizontal: 16,
    marginTop: -16,
    backgroundColor: AppColors.background.default,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 20,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.background.input,
  },
  companyLogoFallback: { alignItems: 'center', justifyContent: 'center' },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  companyLocation: { fontSize: 12, color: AppColors.text.tertiary, marginTop: 2 },
  companyProfileLink: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.status.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: AppColors.text.white },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: AppColors.background.muted,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: AppColors.palette.purple.base },
  statLabelPink: { color: '#db2777' },
  statValue: { fontSize: 18, fontWeight: '700', color: AppColors.text.secondary },
  section: { gap: 8 },
  sectionBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: AppColors.palette.purple.base,
  },
  sectionBarGreen: { backgroundColor: AppColors.status.success },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.text.secondary },
  sectionText: { fontSize: 14, color: AppColors.text.tertiary, lineHeight: 22 },
  requirementsList: { gap: 10 },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.background.muted,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  requirementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.palette.purple.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: { fontSize: 14, color: AppColors.text.secondary, flex: 1 },
  ctaFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: AppColors.background.default,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.text.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  ctaButtonDone: { backgroundColor: '#059669' },
  ctaButtonPressed: { opacity: 0.9 },
  ctaButtonText: { fontSize: 14, fontWeight: '700', color: AppColors.text.white },
});
