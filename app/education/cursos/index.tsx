import { AppColors } from '@/constants/theme';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import {
  COURSE_MODALITY_LABEL,
  COURSE_STATUS_LABEL,
  COURSE_STATUS_TONE,
  getCourseCategories,
  getCourses,
  getMyCourseEnrollments,
  resolveCourseImageSource,
  type Course,
  type CourseCategory,
  type CourseEnrollment,
} from '@/services/educationApi';
import { isoDateToBr } from '@/services/publicServicesHttp';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Tab = 'available' | 'mine';

type SelectOption = { value: string; label: string };

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label || label;

  return (
    <>
      <Pressable style={styles.select} onPress={() => setOpen(true)}>
        <View style={styles.selectTextWrap}>
          <Text style={styles.selectLabel}>{label}</Text>
          <Text style={styles.selectValue} numberOfLines={1}>
            {current}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={AppColors.text.tertiary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.selectSheet}>
            <Text style={styles.selectSheetTitle}>{label}</Text>
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <Pressable
                  key={opt.value || '__all'}
                  style={[styles.selectOption, active && styles.selectOptionActive]}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>
                    {opt.label}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={18} color={AppColors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function CursosScreen() {
  const isVisitante = useIsVisitante();
  const [tab, setTab] = useState<Tab>('available');
  const [courses, setCourses] = useState<Course[]>([]);
  const [allNeighborhoods, setAllNeighborhoods] = useState<string[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [cats, list, mine, neighborhoodsSource] = await Promise.all([
          getCourseCategories().catch(() => [] as CourseCategory[]),
          getCourses({
            q: q.trim() || undefined,
            categoryId: categoryId || undefined,
            neighborhood: neighborhood.trim() || undefined,
          }),
          isVisitante
            ? Promise.resolve([] as CourseEnrollment[])
            : getMyCourseEnrollments().catch(() => [] as CourseEnrollment[]),
          getCourses({}).catch(() => [] as Course[]),
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setCourses(Array.isArray(list) ? list : []);
        setEnrollments(Array.isArray(mine) ? mine : []);
        setAllNeighborhoods(
          [
            ...new Set(
              (Array.isArray(neighborhoodsSource) ? neighborhoodsSource : [])
                .map((c) => c.neighborhood?.trim())
                .filter((n): n is string => !!n),
            ),
          ].sort((a, b) => a.localeCompare(b, 'pt-BR')),
        );
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar cursos');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [q, categoryId, neighborhood, isVisitante],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: '', label: 'Todas as categorias' },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

  const neighborhoodOptions = useMemo<SelectOption[]>(
    () => [
      { value: '', label: 'Todas as localidades' },
      ...allNeighborhoods.map((n) => ({ value: n, label: n })),
    ],
    [allNeighborhoods],
  );

  const renderCourse = ({ item }: { item: Course }) => {
    const cover = resolveCourseImageSource(item);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => router.push(`/education/cursos/${item.id}` as Href)}
      >
        <Image source={cover} style={styles.cover} />
        <View style={styles.cardBody}>
          <Text style={styles.category}>
            {item.categoryName || item.category || 'Curso municipal'}
          </Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.summary} numberOfLines={2}>
            {item.summary || item.description || 'Sem descrição'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{COURSE_MODALITY_LABEL[item.modality]}</Text>
            {item.institution ? <Text style={styles.meta}>· {item.institution}</Text> : null}
          </View>
          <View style={styles.metaRow}>
            {item.workloadHours ? <Text style={styles.meta}>{item.workloadHours}h</Text> : null}
            {item.shift ? <Text style={styles.meta}>· {item.shift}</Text> : null}
            {item.startDate ? <Text style={styles.meta}>· {isoDateToBr(item.startDate)}</Text> : null}
          </View>
          <View style={styles.badges}>
            {item.enrollmentOpenNow ? (
              <View style={[styles.badge, styles.badgeOpen]}>
                <Text style={styles.badgeText}>Inscrições abertas</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeClosed]}>
                <Text style={styles.badgeText}>Inscrições encerradas</Text>
              </View>
            )}
            {item.showVacancies ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.seatsLeft} vagas</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEnrollment = ({ item }: { item: CourseEnrollment }) => {
    const tone = COURSE_STATUS_TONE[item.status];
    return (
      <Pressable
        style={({ pressed }) => [styles.enrollCard, pressed && styles.pressed]}
        onPress={() => router.push(`/education/cursos/inscricoes/${item.id}` as Href)}
      >
        <View style={styles.enrollTop}>
          <Text style={styles.title}>{item.courseTitle}</Text>
          <Text style={styles.protocol}>{item.protocol}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusPillText, { color: tone.text }]}>
            {COURSE_STATUS_LABEL[item.status]}
          </Text>
        </View>
        <Text style={styles.summary}>
          {item.institution || 'Instituição municipal'}
          {item.className ? ` · ${item.className}` : ''}
          {item.modality ? ` · ${COURSE_MODALITY_LABEL[item.modality]}` : ''}
        </Text>
        {item.statusReason ? (
          <Text style={styles.reasonPreview} numberOfLines={2}>
            Motivo: {item.statusReason}
          </Text>
        ) : null}
        <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'available' && styles.tabActive]}
          onPress={() => setTab('available')}
        >
          <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>
            Disponíveis
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
            Minhas inscrições
          </Text>
        </Pressable>
      </View>

      {tab === 'available' ? (
        <>
          <View style={styles.filters}>
            <TextInput
              style={styles.search}
              placeholder="Buscar por nome"
              placeholderTextColor={AppColors.text.quaternary}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={() => void load()}
              returnKeyType="search"
            />
            <View style={styles.selectGrid}>
              <FilterSelect
                label="Categoria"
                value={categoryId}
                options={categoryOptions}
                onChange={setCategoryId}
              />
              <FilterSelect
                label="Localidade"
                value={neighborhood}
                options={neighborhoodOptions}
                onChange={setNeighborhood}
              />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={AppColors.primary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={courses}
              keyExtractor={(item) => item.id}
              renderItem={renderCourse}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
              }
              ListEmptyComponent={
                <Text style={styles.empty}>Nenhum curso encontrado com esses filtros.</Text>
              }
            />
          )}
        </>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={AppColors.primary} />
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={(item) => item.id}
          renderItem={renderEnrollment}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Você ainda não possui inscrições. Explore os cursos disponíveis.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: AppColors.primary },
  tabText: { fontWeight: '700', color: AppColors.text.tertiary, fontSize: 13 },
  tabTextActive: { color: '#fff' },
  filters: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: AppColors.text.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  selectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  select: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectTextWrap: { flex: 1, minWidth: 0 },
  selectLabel: { fontSize: 10, fontWeight: '700', color: AppColors.text.quaternary, textTransform: 'uppercase' },
  selectValue: { marginTop: 2, fontSize: 13, fontWeight: '700', color: AppColors.text.secondary },
  selectBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  selectSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  selectSheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.text.secondary,
    marginBottom: 10,
  },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectOptionActive: { backgroundColor: '#EFF6FF' },
  selectOptionText: { fontSize: 14, color: AppColors.text.secondary, fontWeight: '600', flex: 1 },
  selectOptionTextActive: { color: AppColors.primary, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  cover: { width: '100%', height: 140, backgroundColor: AppColors.primary },
  cardBody: { padding: 14 },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
  },
  title: { marginTop: 4, fontSize: 17, fontWeight: '800', color: AppColors.text.secondary, flex: 1 },
  summary: { marginTop: 6, fontSize: 13, lineHeight: 18, color: AppColors.text.tertiary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  meta: { fontSize: 12, color: AppColors.text.quaternary, fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeOpen: { backgroundColor: '#d1fae5' },
  badgeClosed: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '700', color: AppColors.text.secondary },
  enrollCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  enrollTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  protocol: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  reasonPreview: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: AppColors.text.tertiary,
    fontStyle: 'italic',
  },
  empty: { textAlign: 'center', color: AppColors.text.tertiary, marginTop: 24 },
  error: { color: '#b91c1c', margin: 16 },
  pressed: { opacity: 0.9 },
});
