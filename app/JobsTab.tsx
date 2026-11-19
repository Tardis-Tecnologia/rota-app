import { MARICA_EDITAIS } from '@/constants/maricaEditais';
import JobsOpportunities, {
  type JobCard,
  type ContractType,
  type JobType,
} from '@/components/JobsOpportunities';
import type { JobCategoryId } from '@/constants/jobCategories';
import { JOB_CATEGORIES } from '@/constants/jobCategories';
import { AppColors } from '@/constants/theme';
import { jobRecommendationReasons, listJobs } from '@/services/jobsApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function mapApiJobsToCards(
  rows: Awaited<ReturnType<typeof listJobs>>,
  reasons: Record<string, string> = {},
): JobCard[] {
  return rows.map((job, index) => {
    const workType = (['Remoto', 'Presencial', 'Híbrido'].includes(job.workType)
      ? job.workType
      : 'Presencial') as JobType;
    return {
      id: job.id,
      title: job.title,
      company: job.companyName,
      location: job.location,
      type: workType,
      contractType: job.contractType as ContractType,
      salary: job.salaryLabel,
      image: job.imageUrl || job.companyPhotoUrl || '',
      distance: index * 0.4,
      commercialAccountId: job.commercialAccountId,
      companyPhotoUrl: job.companyPhotoUrl,
      deadlineLabel: job.deadlineLabel,
      reason: reasons[job.id] ?? null,
      tags: [job.contractType, job.workType].filter(Boolean),
    };
  });
}

const heroBanner = {
  title: 'Oportunidades em Maricá',
  description: 'Vagas locais, estágio na Prefeitura e editais abertos na região.',
  image:
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop',
  tag: 'EMPREGO LOCAL',
};

export default function JobsTab() {
  const [activeCategory, setActiveCategory] = useState<JobCategoryId>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiJobs, setApiJobs] = useState<JobCard[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [showEditais, setShowEditais] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const editaisOffset = useRef(0);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const rows = await listJobs({
        category: activeCategory === 'todos' ? undefined : activeCategory,
        q: searchQuery.trim() || undefined,
        init: 0,
        end: 40,
      });
      const reasons = await jobRecommendationReasons(searchQuery).catch(() => ({}));
      setApiJobs(mapApiJobsToCards(rows, reasons));
      if (rows.length === 0) {
        setJobsError('Nenhuma vaga publicada no momento.');
      }
    } catch (e) {
      setApiJobs([]);
      setJobsError(
        e instanceof Error ? e.message : 'Não foi possível carregar as vagas do servidor.',
      );
    } finally {
      setLoadingJobs(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => void loadJobs(), 250);
    return () => clearTimeout(t);
  }, [loadJobs]);

  useEffect(() => {
    if (!showEditais) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(editaisOffset.current - 8, 0), animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [showEditais]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={AppColors.text.tertiary}
            />
          </Pressable>

          <Text style={styles.headerTitle}>Oportunidades</Text>

          <Pressable
            onPress={() => searchInputRef.current?.focus()}
            hitSlop={12}
            accessibilityLabel="Filtrar por profissão"
            style={({ pressed }) => [
              styles.filterButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons
              name="filter-outline"
              size={24}
              color={AppColors.text.tertiary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: heroBanner.image }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={['#3C3895', '#312E82']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>{heroBanner.tag}</Text>
              </View>
              <Text style={styles.heroTitle}>{heroBanner.title}</Text>
              <Text style={styles.heroSubtitle}>{heroBanner.description}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.heroCta,
                  pressed && styles.heroCtaPressed,
                ]}
                onPress={() => setShowEditais(true)}
                accessibilityRole="button"
                accessibilityLabel="Ver editais de Maricá"
              >
                <Text style={styles.heroCtaText}>VER EDITAIS</Text>
                <Ionicons name="arrow-forward" size={18} color={AppColors.text.secondary} />
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        {showEditais ? (
          <View
            style={styles.editaisSection}
            onLayout={(event) => {
              editaisOffset.current = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.editaisTitle}>Editais em Maricá</Text>
            <Text style={styles.editaisHint}>
              Processos da prefeitura. Abra um edital para ver as regras e seguir para o cadastro oficial.
            </Text>
            {MARICA_EDITAIS.map((edital) => (
              <Pressable
                key={edital.id}
                style={({ pressed }) => [styles.editalCard, pressed && styles.editalCardPressed]}
                onPress={() =>
                  router.push({ pathname: '/EditalDetail', params: { id: edital.id } })
                }
                accessibilityRole="button"
                accessibilityLabel={edital.title}
              >
                <View style={styles.editalCardBody}>
                  <Text style={styles.editalStatus}>{edital.status}</Text>
                  <Text style={styles.editalCardTitle}>{edital.title}</Text>
                  <Text style={styles.editalOrgan}>{edital.organ}</Text>
                  <Text style={styles.editalSummary} numberOfLines={3}>
                    {edital.summary}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={AppColors.text.tertiary} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Qual profissão você procura?"
            placeholderTextColor={AppColors.text.tertiary}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar vaga por profissão"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={20} color={AppColors.text.tertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.filtersContainer}>
          {JOB_CATEGORIES.map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setActiveCategory(item.id as JobCategoryId)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.jobsOpportunitiesContainer}>
          {loadingJobs ? (
            <View style={{ paddingVertical: 28, alignItems: 'center' }}>
              <ActivityIndicator color="#7c3aed" />
            </View>
          ) : jobsError && apiJobs.length === 0 ? (
            <View style={{ paddingVertical: 20, paddingHorizontal: 8, gap: 12 }}>
              <Text style={{ textAlign: 'center', color: AppColors.text.tertiary, lineHeight: 20 }}>
                {jobsError}
              </Text>
              <Pressable
                onPress={() => void loadJobs()}
                style={({ pressed }) => [
                  {
                    alignSelf: 'center',
                    backgroundColor: '#0f172a',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <JobsOpportunities
              variant="list"
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              jobs={apiJobs}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomCtaFixed}>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Em breve',
              'Em breve as empresas da cidade poderão anunciar vagas por aqui.',
            )
          }
          style={({ pressed }) => [
            styles.bottomCta,
            pressed && styles.bottomCtaPressed,
          ]}
        >
          <Text style={styles.bottomCtaText}>PAINEL DO EMPREGADOR</Text>
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
  header: {
    backgroundColor: AppColors.background.overlay,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.overlayPressed,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 200,
  },
  heroImage: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: 24,
  },
  heroContent: {
    padding: 20,
    gap: 10,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.background.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.text.yellow,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  heroSubtitle: {
    fontSize: 13,
    color: AppColors.text.white,
    opacity: 0.9,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.text.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  heroCtaPressed: {
    opacity: 0.9,
  },
  heroCtaText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.background.darkBlue,
  },
  editaisSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  editaisTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  editaisHint: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
  editalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  editalCardPressed: { opacity: 0.9 },
  editalCardBody: { flex: 1, gap: 4 },
  editalStatus: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#5b21b6',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  editalCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  editalOrgan: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  editalSummary: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: AppColors.background.muted,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.text.secondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.background.muted,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  filterChipActive: {
    backgroundColor: AppColors.palette.indigo.light,
    borderColor: AppColors.palette.purple.base,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  filterChipTextActive: {
    color: AppColors.palette.purple.base,
  },
  jobsOpportunitiesContainer: {
    marginHorizontal: 16,
  },
  bottomCtaFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: AppColors.background.default,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
  },
  bottomCta: {
    backgroundColor: AppColors.background.darkBlue,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaPressed: {
    opacity: 0.9,
  },
  bottomCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.white,
  },
});