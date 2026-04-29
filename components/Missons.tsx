import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MissionCategory, RankingEntry } from '@/data/mockMissions';
import { MissionCard } from '@/components/MissionCard';
import { mockRankingEntries } from '@/data/mockMissions';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { CitizenMissionListItem, CitizenMissionSubmissionStatus, MySubmissionItem } from '@/services/citizenMissionsApi';
import * as citizenMissionsApi from '@/services/citizenMissionsApi';
import { getApiBaseUrl } from '@/services/authApi';
import { Popout } from '@/components/Popout';
import { useAuth } from '@/contexts/AuthContext';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${label}`}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function RankingCard({
  weekLabel,
  rankPosition,
  entries,
}: {
  weekLabel: string;
  rankPosition: number;
  entries: RankingEntry[];
}) {
  return (
    <View style={styles.rankingWrap}>
      <View style={styles.rankingHeaderRow}>
        <Text style={styles.rankingTitle}>RANKING DO BAIRRO</Text>
        <View style={styles.rankPill}>
          <Ionicons name="trophy-outline" size={16} color={AppColors.palette.amber.base} />
          <Text style={styles.rankPillText}>{`#${rankPosition}`}</Text>
        </View>
      </View>

      <View style={styles.rankingCard}>
        <View style={styles.rankingTopRow}>
          <View style={styles.rankingWeekRow}>
            <Ionicons name="people-outline" size={18} color={AppColors.text.tertiary} />
            <Text style={styles.rankingWeekText}>{weekLabel}</Text>
          </View>
          <Text style={styles.rankingPointsHeader}>Pontos por missões</Text>
        </View>

        <View style={styles.rankingDivider} />

        {entries.map((entry, index) => {
          const position = index + 1;
          const medalBg =
            position === 1
              ? AppColors.palette.amber.light
              : position === 2
                ? '#EEF2FF'
                : position === 3
                  ? '#FEE2E2'
                  : AppColors.background.muted;
          return (
            <View key={entry.id} style={styles.rankingRow}>
              <View style={[styles.positionBadge, { backgroundColor: medalBg }]}>
                <Text style={styles.positionBadgeText}>{position}</Text>
              </View>
              <Text style={styles.rankingName} numberOfLines={1}>
                {entry.name}
              </Text>
              <View style={styles.rankingPointsRow}>
                <Ionicons name="star" size={16} color={AppColors.text.yellow} />
                <Text style={styles.rankingPointsText}>{entry.points}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function Missons() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isVisitante = user?.profile === 'VISITANTE';
    const [selectedCategory, setSelectedCategory] = useState<MissionCategory>('Todas');
    const [missions, setMissions] = useState<CitizenMissionListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [submissionsCache, setSubmissionsCache] = useState<MySubmissionItem[] | null>(null);
    const [showVisitanteOverlay, setShowVisitanteOverlay] = useState(false);

    const [popout, setPopout] = useState<{
      visible: boolean;
      type: 'success' | 'error' | 'info' | 'warning';
      title: string;
      message?: string | null;
    }>({ visible: false, type: 'info', title: '', message: null });

    const [evidenceModal, setEvidenceModal] = useState<{
      visible: boolean;
      mission: CitizenMissionListItem | null;
      uri: string | null;
      mimeType?: string | null;
      fileName?: string | null;
      submitting: boolean;
    }>({ visible: false, mission: null, uri: null, submitting: false });

    const handleBack = useCallback(() => {
        router.replace('/(tabs)/home');
      }, []);

    const categories: MissionCategory[] = ['Todas'];

    const activeCount = useMemo(() => {
      return missions.filter((m) => {
        const st = m.mySubmission?.status;
        return st === 'ACCEPTED' || st === 'PENDING' || st === 'UNDER_REVIEW';
      }).length;
    }, [missions]);

    const loadMissions = useCallback(async () => {
      setErrorMessage(null);
      try {
        const data = await citizenMissionsApi.listMissions();
        setMissions(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Não foi possível carregar as missões.';
        setErrorMessage(msg);
      }
    }, []);

    const showPopout = useCallback(
      (params: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string | null }) => {
        setPopout({ visible: true, type: params.type, title: params.title, message: params.message ?? null });
      },
      [],
    );

    const ensureMySubmissionsLoaded = useCallback(async (): Promise<MySubmissionItem[]> => {
      if (isVisitante) return [];
      if (submissionsCache) return submissionsCache;
      try {
        const rows = await citizenMissionsApi.listMySubmissions();
        setSubmissionsCache(rows);
        return rows;
      } catch {
        // silencioso; o usuário ainda pode ver status pela lista de missões.
        return [];
      }
    }, [isVisitante, submissionsCache]);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          await loadMissions();
          // Carrega submissões para exibir notas (rejeição) e comprovação.
          if (!isVisitante) {
            void ensureMySubmissionsLoaded();
          }
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [ensureMySubmissionsLoaded, isVisitante, loadMissions]);

    const filteredMissions = useMemo(() => {
      // Backend ainda não tem categorias; mantemos chip "Todas" apenas.
      if (selectedCategory === 'Todas') return missions;
      return missions;
    }, [missions, selectedCategory]);
    const rankingEntries = mockRankingEntries;

    const openEvidenceModal = useCallback((mission: CitizenMissionListItem) => {
      setEvidenceModal({ visible: true, mission, uri: null, submitting: false });
    }, []);

    const closeEvidenceModal = useCallback(() => {
      setEvidenceModal({ visible: false, mission: null, uri: null, submitting: false });
    }, []);

    const ensureGalleryPermission = useCallback(async (): Promise<boolean> => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Para escolher uma foto, permita o acesso à galeria nas configurações do aparelho.',
        );
        return false;
      }
      return true;
    }, []);

    const ensureCameraPermission = useCallback(async (): Promise<boolean> => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Para tirar uma foto, permita o uso da câmera nas configurações do aparelho.',
        );
        return false;
      }
      return true;
    }, []);

    const pickFromGallery = useCallback(async () => {
      if (!(await ensureGalleryPermission())) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });
      const asset = result.assets?.[0];
      if (!result.canceled && asset?.uri) {
        setEvidenceModal((prev) => ({
          ...prev,
          uri: asset.uri,
          mimeType: asset.mimeType ?? null,
          fileName: asset.fileName ?? null,
        }));
      }
    }, [ensureGalleryPermission]);

    const takePhoto = useCallback(async () => {
      if (!(await ensureCameraPermission())) return;
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
      });
      const asset = result.assets?.[0];
      if (!result.canceled && asset?.uri) {
        setEvidenceModal((prev) => ({
          ...prev,
          uri: asset.uri,
          mimeType: asset.mimeType ?? null,
          fileName: asset.fileName ?? null,
        }));
      }
    }, [ensureCameraPermission]);

    const findCachedSubmissionForMission = useCallback(
      (missionId: string): MySubmissionItem | null => {
        const rows = submissionsCache ?? [];
        return rows.find((s) => s.mission.id === missionId) ?? null;
      },
      [submissionsCache],
    );

    const onPressMissionPrimary = useCallback(
      async (mission: CitizenMissionListItem) => {
        const st = mission.mySubmission?.status ?? null;

        if (!st) {
          if (isVisitante) {
            setShowVisitanteOverlay(true);
            return;
          }
          try {
            await citizenMissionsApi.acceptMission(mission.id);
            await loadMissions();
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Não foi possível aceitar a missão.';
            showPopout({ type: 'error', title: 'Não foi possível aceitar', message: msg });
          }
          return;
        }

        if (st === 'APPROVED') {
          const rows = await ensureMySubmissionsLoaded();
          const sub = rows.find((s) => s.mission.id === mission.id) ?? findCachedSubmissionForMission(mission.id);
          if (!sub?.evidenceImage?.id && !sub?.evidenceImage?.publicUrl) {
            showPopout({
              type: 'warning',
              title: 'Comprovação indisponível',
              message: 'Não foi possível carregar a imagem da comprovação.',
            });
            return;
          }

          const imageUri =
            sub.evidenceImage?.publicUrl?.trim() ||
            (sub.evidenceImage?.id
              ? `${getApiBaseUrl()}/api/v1/upload/files/${sub.evidenceImage.id}`
              : null);

          setEvidenceModal({
            visible: true,
            mission,
            uri: imageUri,
            submitting: false,
          });
          return;
        }

        if (st === 'ACCEPTED') {
          openEvidenceModal(mission);
          return;
        }

        if (st === 'PENDING' || st === 'UNDER_REVIEW') {
          showPopout({
            type: 'info',
            title: 'Em análise',
            message: 'Sua comprovação está em análise. Assim que for revisada, você verá aqui o resultado.',
          });
          return;
        }

        // REJECTED -> permitir reenviar
        openEvidenceModal(mission);
      },
      [
        ensureMySubmissionsLoaded,
        isVisitante,
        findCachedSubmissionForMission,
        loadMissions,
        openEvidenceModal,
        showPopout,
      ],
    );

    const submitEvidence = useCallback(async () => {
      const mission = evidenceModal.mission;
      const uri = evidenceModal.uri;
      if (!mission) return;
      if (!uri) {
        showPopout({
          type: 'warning',
          title: 'Envio da comprovação',
          message: 'Escolha uma imagem para enviar como prova.',
        });
        return;
      }
      setEvidenceModal((prev) => ({ ...prev, submitting: true }));
      try {
        const up = await citizenMissionsApi.uploadEvidenceImageFromUri(uri, {
          mimeType: evidenceModal.mimeType ?? undefined,
          fileName: evidenceModal.fileName ?? undefined,
        });
        await citizenMissionsApi.submitMission(mission.id, { evidenceImageId: up.id });
        closeEvidenceModal();
        setSubmissionsCache(null);
        await loadMissions();
        showPopout({
          type: 'success',
          title: 'Enviado!',
          message: 'Sua comprovação foi enviada e ficará pendente de análise.',
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Não foi possível enviar a comprovação. Tente novamente.';
        showPopout({ type: 'error', title: 'Erro ao enviar', message: msg });
      } finally {
        setEvidenceModal((prev) => ({ ...prev, submitting: false }));
      }
    }, [closeEvidenceModal, evidenceModal.fileName, evidenceModal.mimeType, evidenceModal.mission, evidenceModal.uri, loadMissions, showPopout]);

    const onRefresh = useCallback(async () => {
      try {
        await loadMissions();
      } finally {
      }
    }, [loadMissions]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a Home"
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={AppColors.text.secondary} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Missões Cidadãs</Text>
        </View>

        <View style={styles.headerRight}>
          <Ionicons name="flame-outline" size={18} color={AppColors.report.orange} />
          <Text style={styles.headerRightText}>{`${activeCount} ativas`}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {categories.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                active={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={{ height: 12 }} />
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.loadingText}>Carregando missões…</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente"
              onPress={() => void onRefresh()}
              style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.list}>
          {filteredMissions.map((mission) => {
            const submissionStatus = (mission.mySubmission?.status ?? null) as CitizenMissionSubmissionStatus | null;
            const cached = submissionsCache?.find((s) => s.mission.id === mission.id) ?? null;
            const note = cached?.note ?? null;
            const evidenceImageUri =
              cached?.evidenceImage?.publicUrl?.trim() ||
              (cached?.evidenceImage?.id
                ? `${getApiBaseUrl()}/api/v1/upload/files/${cached.evidenceImage.id}`
                : null);
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                submission={
                  mission.mySubmission
                    ? {
                        status: submissionStatus!,
                        note,
                        evidenceImageUri,
                      }
                    : null
                }
                onPressPrimary={() => void onPressMissionPrimary(mission)}
              />
            );
          })}
        </View>

        <RankingCard weekLabel="Semana 2026-W18" rankPosition={2} entries={rankingEntries} />
      </ScrollView>

      <Modal visible={evidenceModal.visible} transparent animationType="slide" onRequestClose={closeEvidenceModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTouchableArea} onPress={closeEvidenceModal} />
          <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {evidenceModal.mission?.mySubmission?.status === 'APPROVED'
                  ? 'Comprovação'
                  : 'Enviar comprovação'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeEvidenceModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color={AppColors.text.secondary} />
              </TouchableOpacity>
            </View>

            {evidenceModal.uri ? (
              <View style={styles.evidencePreviewWrap}>
                <Image
                  source={{ uri: evidenceModal.uri }}
                  style={styles.evidencePreview}
                  contentFit="cover"
                  transition={150}
                />
                {evidenceModal.mission?.mySubmission?.status !== 'APPROVED' ? (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setEvidenceModal((prev) => ({ ...prev, uri: null }))}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Remover imagem"
                  >
                    <Ionicons name="close-circle" size={28} color={AppColors.status.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.evidenceEmpty}>
                <Ionicons name="image-outline" size={32} color={AppColors.text.tertiary} />
                <Text style={styles.evidenceEmptyText}>
                  Escolha uma foto para enviar como prova.
                </Text>
              </View>
            )}

            {evidenceModal.mission?.mySubmission?.status !== 'APPROVED' ? (
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={() => void pickFromGallery()}
                  activeOpacity={0.85}
                  disabled={evidenceModal.submitting}
                >
                  <Ionicons name="images-outline" size={22} color={AppColors.accent} />
                  <Text style={styles.imageActionButtonText}>Galeria</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={() => void takePhoto()}
                  activeOpacity={0.85}
                  disabled={evidenceModal.submitting}
                >
                  <Ionicons name="camera-outline" size={22} color={AppColors.accent} />
                  <Text style={styles.imageActionButtonText}>Câmera</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {evidenceModal.mission?.mySubmission?.status !== 'APPROVED' ? (
              <TouchableOpacity
                style={[styles.submitButton, evidenceModal.submitting && styles.submitButtonDisabled]}
                onPress={() => void submitEvidence()}
                activeOpacity={0.85}
                disabled={evidenceModal.submitting}
              >
                {evidenceModal.submitting ? (
                  <ActivityIndicator color={AppColors.text.white} />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color={AppColors.text.white} />
                    <Text style={styles.submitButtonText}>Enviar prova</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      <Popout
        visible={popout.visible}
        type={popout.type}
        title={popout.title}
        message={popout.message}
        primaryLabel="OK"
        onClose={() => setPopout((prev) => ({ ...prev, visible: false }))}
      />

      <VisitanteLoginOverlay
        visible={showVisitanteOverlay}
        message="Para aceitar missões e enviar comprovação, faça login com uma conta cadastrada."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: AppColors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  headerRightText: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.report.orange,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  loadingWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.tertiary,
  },
  errorWrap: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: AppColors.background.backgroundDanger,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.status.error,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.text.tertiary,
  },
  chipLabelActive: {
    color: AppColors.text.white,
  },
  list: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 10,
  },
  rankingWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  rankingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rankingTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: AppColors.text.tertiary,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  rankPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    overflow: 'hidden',
  },
  rankingTopRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rankingWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankingWeekText: {
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingPointsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.text.tertiary,
  },
  rankingDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  rankingRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  rankingPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankingPointsText: {
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchableArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: AppColors.background.default,
    paddingTop: 18,
    paddingHorizontal: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  sheetHeader: {
    position: 'relative',
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.secondary,
    paddingRight: 40,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -4,
    padding: 4,
  },
  evidencePreviewWrap: {
    marginTop: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.muted,
    position: 'relative',
  },
  evidencePreview: {
    width: '100%',
    height: 220,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
  },
  evidenceEmpty: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.muted,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  evidenceEmptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
  },
  imageActionButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.accent,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.85,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.white,
  },
});