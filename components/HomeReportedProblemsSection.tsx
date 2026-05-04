import { AppColors } from '@/constants/theme';
import {
    getTopReportedProblems,
    listHostAreas,
    type HostAreaDto,
    type TopReportedProblemsResponseDto,
} from '@/services/pulseApi';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type HomeReportedProblemsSectionProps = {
  refreshKey?: number;
};

export default function HomeReportedProblemsSection({
  refreshKey = 0,
}: HomeReportedProblemsSectionProps) {
  const router = useRouter();
  const [areas, setAreas] = useState<HostAreaDto[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadAreas, setLoadAreas] = useState(true);
  const [loadProblems, setLoadProblems] = useState(false);
  const [top, setTop] = useState<TopReportedProblemsResponseDto | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [problemsError, setProblemsError] = useState<string | null>(null);

  const selectedName = useMemo(() => {
    return areas.find((a) => a.id === selectedAreaId)?.name ?? 'Selecione a região';
  }, [areas, selectedAreaId]);

  const loadAreasList = useCallback(async () => {
    setLoadAreas(true);
    setAreasError(null);
    try {
      const list = await listHostAreas();
      setAreas(list);
      setSelectedAreaId((prev) => {
        if (list.length === 0) return '';
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list[0].id;
      });
    } catch (e) {
      setAreas([]);
      setSelectedAreaId('');
      setAreasError(e instanceof Error ? e.message : 'Não foi possível carregar as regiões.');
    } finally {
      setLoadAreas(false);
    }
  }, []);

  useEffect(() => {
    void loadAreasList();
  }, [loadAreasList, refreshKey]);

  useEffect(() => {
    if (!selectedAreaId) {
      setTop(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadProblems(true);
      setProblemsError(null);
      try {
        const data = await getTopReportedProblems(selectedAreaId, 5);
        if (!cancelled) setTop(data);
      } catch (e) {
        if (!cancelled) {
          setTop(null);
          setProblemsError(
            e instanceof Error ? e.message : 'Não foi possível carregar os problemas.',
          );
        }
      } finally {
        if (!cancelled) setLoadProblems(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedAreaId, refreshKey]);

  const onSelectArea = (id: string) => {
    setSelectedAreaId(id);
    setPickerOpen(false);
  };

  if (loadAreas && areas.length === 0 && !areasError) {
    return (
      <View style={styles.outer}>
        <View style={styles.card}>
          <ActivityIndicator size="small" color={AppColors.primary} />
        </View>
      </View>
    );
  }

  if (areasError || areas.length === 0) {
    return (
      <View style={styles.outer}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>PROBLEMAS MAIS REPORTADOS</Text>
            <Pressable onPress={() => router.push('/pulso')} hitSlop={8}>
              <Text style={styles.verPulso}>Ver Pulso</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Dados comunitários relacionados ao Pulso do Bairro.
          </Text>
          <Text style={styles.inlineError}>
            {areasError ?? 'Nenhuma região disponível para este host.'}
          </Text>
        </View>
      </View>
    );
  }

  const items = top?.items ?? [];

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            PROBLEMAS MAIS REPORTADOS
          </Text>
          <Pressable onPress={() => router.push('/pulso')} hitSlop={8}>
            <Text style={styles.verPulso}>Ver Pulso</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Dados comunitários relacionados ao Pulso do Bairro.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.dropdown, pressed && styles.dropdownPressed]}
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Selecionar região para ver problemas reportados"
        >
          <Text style={styles.dropdownLabel}>Região</Text>
          <View style={styles.dropdownValueRow}>
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {selectedName}
            </Text>
            <Feather name="chevron-down" size={20} color={AppColors.text.tertiary} />
          </View>
        </Pressable>

        {loadProblems ? (
          <View style={styles.problemsLoading}>
            <ActivityIndicator size="small" color={AppColors.primary} />
          </View>
        ) : problemsError ? (
          <Text style={styles.inlineError}>{problemsError}</Text>
        ) : (
          <View style={styles.list}>
            {items.length === 0 ? (
              <Text style={styles.empty}>Nenhum problema reportado ainda nesta região.</Text>
            ) : (
              items.map((p) => (
                <View key={p.problemKey} style={styles.row}>
                  <View style={styles.left}>
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color={AppColors.palette.orange.base}
                      />
                    </View>
                    <Text style={styles.label}>{p.labelPtBr}</Text>
                  </View>
                  <Text style={styles.count}>{p.reportCount} relatos</Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setPickerOpen(false)}
            accessibilityLabel="Fechar seleção de região"
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Região</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {areas.map((a) => {
                const selected = a.id === selectedAreaId;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => onSelectArea(a.id)}
                  >
                    <Text
                      style={[styles.modalItemText, selected && styles.modalItemTextSelected]}
                      numberOfLines={2}
                    >
                      {a.name}
                    </Text>
                    {selected ? (
                      <Feather name="check" size={18} color={AppColors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPickerOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: AppColors.text.secondary,
  },
  verPulso: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.accent,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.text.tertiary,
    marginBottom: 14,
    lineHeight: 18,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: AppColors.background.muted,
  },
  dropdownPressed: {
    opacity: 0.92,
  },
  dropdownLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  problemsLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  empty: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.tertiary,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#9A5B06',
  },
  count: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  inlineError: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.status.error,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    maxHeight: '70%',
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text.secondary,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  modalList: {
    maxHeight: 320,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  modalItemTextSelected: {
    fontWeight: '800',
    color: AppColors.primary,
  },
  modalCloseBtn: {
    marginTop: 8,
    marginHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: AppColors.background.muted,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
});
