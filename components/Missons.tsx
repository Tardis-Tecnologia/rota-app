import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MissionCard } from '@/components/MissionCard';
import { Popout } from '@/components/Popout';
import { RankingCard } from '@/components/RankingCard';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/services/authApi';
import type {
    CitizenMissionListItem,
    CitizenMissionSubmissionStatus,
    MySubmissionItem,
    WeeklyMissionsRankingResponse,
} from '@/services/citizenMissionsApi';
import * as citizenMissionsApi from '@/services/citizenMissionsApi';
import { notifyRewardPointsChanged } from '@/services/rewardPointsBridge';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

type MissionCategory = 'Todas';

/** Deve coincidir com o default do backend (init..init+10). */
const MISSIONS_PAGE_SIZE = 10;

const MISSION_CATEGORIES: MissionCategory[] = ['Todas'];

const VISITANTE_MSG_MISSIONS =
  'Para aceitar missões e enviar comprovação, faça login com uma conta cadastrada.';
const VISITANTE_MSG_RANKING =
  'Para ver o ranking semanal do bairro, faça login com uma conta cadastrada.';

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

export function Missons() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isVisitante = user?.profile === 'VISITANTE';
    const [selectedCategory, setSelectedCategory] = useState<MissionCategory>('Todas');
    const [missions, setMissions] = useState<CitizenMissionListItem[]>([]);
    const [missionsHasMore, setMissionsHasMore] = useState(true);
    const [missionsLoadingMore, setMissionsLoadingMore] = useState(false);
    const [listRefreshing, setListRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [submissionsCache, setSubmissionsCache] = useState<MySubmissionItem[] | null>(null);
    const [showVisitanteOverlay, setShowVisitanteOverlay] = useState(false);
    const [visitantePromptMessage, setVisitantePromptMessage] = useState(VISITANTE_MSG_MISSIONS);
    const [rankingModalVisible, setRankingModalVisible] = useState(false);
    const [weeklyRanking, setWeeklyRanking] = useState<WeeklyMissionsRankingResponse | null>(null);
    const [missionActionLoadingId, setMissionActionLoadingId] = useState<string | null>(null);
    const [localSubmissionStatusByMissionId, setLocalSubmissionStatusByMissionId] = useState<
      Record<string, CitizenMissionSubmissionStatus>
    >({});
    const previousSubmissionStatusRef = useRef<Record<string, CitizenMissionSubmissionStatus | null>>({});
    const missionsListGenRef = useRef(0);
    const loadMoreInFlightRef = useRef(false);

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

    const closeRankingModal = useCallback(() => {
      setRankingModalVisible(false);
    }, []);

    const categories = MISSION_CATEGORIES;

    const resolveStatus = useCallback(
      (mission: CitizenMissionListItem): CitizenMissionSubmissionStatus | null => {
        return (
          mission.mySubmission?.status ??
          submissionsCache?.find((s) => s.mission.id === mission.id)?.status ??
          localSubmissionStatusByMissionId[mission.id] ??
          null
        );
      },
      [localSubmissionStatusByMissionId, submissionsCache],
    );

    const hasMissionsUnderReview = useMemo(
      () =>
        missions.some((m) => {
          const st = resolveStatus(m);
          return st === 'PENDING' || st === 'UNDER_REVIEW';
        }),
      [missions, resolveStatus],
    );

    const loadMissionsInitial = useCallback(async () => {
      missionsListGenRef.current += 1;
      const gen = missionsListGenRef.current;
      loadMoreInFlightRef.current = false;
      setMissionsLoadingMore(false);
      setErrorMessage(null);
      try {
        const data = await citizenMissionsApi.listMissions({ init: 0, end: MISSIONS_PAGE_SIZE });
        if (gen !== missionsListGenRef.current) return;
        setMissions(data);
        setMissionsHasMore(data.length === MISSIONS_PAGE_SIZE);
      } catch (e) {
        if (gen !== missionsListGenRef.current) return;
        const msg = e instanceof Error ? e.message : 'Não foi possível carregar as missões.';
        setErrorMessage(msg);
        setMissionsHasMore(false);
      }
    }, []);

    const loadMoreMissions = useCallback(async () => {
      if (!missionsHasMore || loading || errorMessage) return;
      if (missions.length === 0) return;
      if (loadMoreInFlightRef.current) return;
      const genAtStart = missionsListGenRef.current;
      loadMoreInFlightRef.current = true;
      setMissionsLoadingMore(true);
      try {
        const init = missions.length;
        const end = init + MISSIONS_PAGE_SIZE;
        const data = await citizenMissionsApi.listMissions({ init, end });
        if (genAtStart !== missionsListGenRef.current) return;
        if (data.length === 0) {
          setMissionsHasMore(false);
          return;
        }
        setMissions((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const row of data) {
            if (!seen.has(row.id)) {
              merged.push(row);
              seen.add(row.id);
            }
          }
          return merged;
        });
        setMissionsHasMore(data.length === MISSIONS_PAGE_SIZE);
      } catch {
        if (genAtStart !== missionsListGenRef.current) return;
      } finally {
        loadMoreInFlightRef.current = false;
        setMissionsLoadingMore(false);
      }
    }, [missions.length, missionsHasMore, loading, errorMessage]);

    const showPopout = useCallback(
      (params: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string | null }) => {
        setPopout({ visible: true, type: params.type, title: params.title, message: params.message ?? null });
      },
      [],
    );

    /** Sempre busca do servidor (após aceitar/enviar/aprovar). */
    const refreshMySubmissions = useCallback(async (): Promise<MySubmissionItem[]> => {
      if (isVisitante) return [];
      try {
        const rows = await citizenMissionsApi.listMySubmissions();
        setSubmissionsCache(rows);
        return rows;
      } catch {
        return [];
      }
    }, [isVisitante]);

    const loadWeeklyRanking = useCallback(async () => {
      if (isVisitante) {
        setWeeklyRanking(null);
        return;
      }
      try {
        const data = await citizenMissionsApi.getWeeklyMissionsRanking({ init: 0, end: 10 });
        setWeeklyRanking(data);
      } catch {
        // ranking é complementar; não bloqueia a tela
        setWeeklyRanking(null);
      }
    }, [isVisitante]);

    const onPressRankingHeader = useCallback(() => {
      if (isVisitante) {
        setVisitantePromptMessage(VISITANTE_MSG_RANKING);
        setShowVisitanteOverlay(true);
        return;
      }
      setRankingModalVisible(true);
      if (!weeklyRanking) {
        void loadWeeklyRanking();
      }
    }, [isVisitante, loadWeeklyRanking, weeklyRanking]);

    const refreshAll = useCallback(async () => {
      await loadMissionsInitial();
      if (!isVisitante) {
        await refreshMySubmissions();
        await loadWeeklyRanking();
      }
    }, [isVisitante, loadMissionsInitial, loadWeeklyRanking, refreshMySubmissions]);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          await refreshAll();
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [refreshAll]);

    useFocusEffect(
      useCallback(() => {
        if (isVisitante) return;
        void refreshAll();
      }, [isVisitante, refreshAll]),
    );

    useEffect(() => {
      if (isVisitante || !hasMissionsUnderReview) return;
      const timer = setInterval(() => {
        void refreshAll();
      }, 15000);
      return () => clearInterval(timer);
    }, [hasMissionsUnderReview, isVisitante, refreshAll]);

    useEffect(() => {
      const previousStatuses = previousSubmissionStatusRef.current;
      const newlyApproved = missions.filter((mission) => {
        const nextStatus = resolveStatus(mission);
        const previousStatus = previousStatuses[mission.id] ?? null;
        return (
          nextStatus === 'APPROVED' &&
          (previousStatus === 'PENDING' || previousStatus === 'UNDER_REVIEW')
        );
      });

      const currentStatuses: Record<string, CitizenMissionSubmissionStatus | null> = {};
      missions.forEach((mission) => {
        currentStatuses[mission.id] = resolveStatus(mission);
      });
      previousSubmissionStatusRef.current = currentStatuses;

      if (newlyApproved.length === 0) return;

      setSubmissionsCache(null);
      void refreshMySubmissions();
      notifyRewardPointsChanged();
      showPopout({
        type: 'success',
        title: 'Missão aprovada!',
        message:
          newlyApproved.length > 1
            ? 'Suas comprovações foram aprovadas. Seus pontos já foram atualizados.'
            : 'Sua comprovação foi aprovada. Seus pontos já foram atualizados.',
      });
    }, [missions, refreshMySubmissions, resolveStatus, showPopout]);

    // Servidor passou a enviar mySubmission na lista: remove overlay local para não divergir.
    useEffect(() => {
      setLocalSubmissionStatusByMissionId((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id of Object.keys(next)) {
          const m = missions.find((x) => x.id === id);
          if (m?.mySubmission?.status) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, [missions]);

    const filteredMissions = useMemo(() => {
      // Backend ainda não tem categorias; mantemos chip "Todas" apenas.
      if (selectedCategory === 'Todas') return missions;
      return missions;
    }, [missions, selectedCategory]);

    const getEffectiveSubmissionStatus = useCallback(
      (mission: CitizenMissionListItem): CitizenMissionSubmissionStatus | null => {
        return resolveStatus(mission);
      },
      [resolveStatus],
    );

    const evidenceModalEffectiveStatus = useMemo(() => {
      const m = evidenceModal.mission;
      if (!m) return null;
      return getEffectiveSubmissionStatus(m);
    }, [evidenceModal.mission, getEffectiveSubmissionStatus]);

    const weekLabel = useMemo(() => {
      const startIso = weeklyRanking?.weekStart ?? null;
      const endIso = weeklyRanking?.weekEnd ?? null;
      if (!startIso || !endIso) return 'Semana';
      const start = new Date(startIso);
      const end = new Date(endIso);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Semana';
      const fmt = (d: Date) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
      return `Semana ${fmt(start)} - ${fmt(end)}`;
    }, [weeklyRanking?.weekEnd, weeklyRanking?.weekStart]);

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
        const st = getEffectiveSubmissionStatus(mission);

        if (!st) {
          if (isVisitante) {
            setVisitantePromptMessage(VISITANTE_MSG_MISSIONS);
            setShowVisitanteOverlay(true);
            return;
          }
          setMissionActionLoadingId(mission.id);
          setLocalSubmissionStatusByMissionId((prev) => ({ ...prev, [mission.id]: 'ACCEPTED' }));
          const nowIso = new Date().toISOString();
          setMissions((prev) =>
            prev.map((row) =>
              row.id === mission.id
                ? {
                    ...row,
                    mySubmission: row.mySubmission ?? {
                      id: `local-${mission.id}`,
                      status: 'ACCEPTED',
                      createdAt: nowIso,
                      updatedAt: nowIso,
                    },
                  }
                : row,
            ),
          );
          try {
            const accepted = await citizenMissionsApi.acceptMission(mission.id);
            const ts = new Date().toISOString();
            setMissions((prev) =>
              prev.map((row) =>
                row.id === mission.id
                  ? {
                      ...row,
                      mySubmission: {
                        id: accepted.id,
                        status: accepted.status,
                        createdAt: row.mySubmission?.createdAt ?? ts,
                        updatedAt: ts,
                      },
                    }
                  : row,
              ),
            );
            setLocalSubmissionStatusByMissionId((prev) => ({ ...prev, [mission.id]: accepted.status }));
            await loadMissionsInitial();
            await refreshMySubmissions();
          } catch (e) {
            setLocalSubmissionStatusByMissionId((prev) => {
              const next = { ...prev };
              delete next[mission.id];
              return next;
            });
            await loadMissionsInitial();
            const msg = e instanceof Error ? e.message : 'Não foi possível aceitar a missão.';
            showPopout({ type: 'error', title: 'Não foi possível aceitar', message: msg });
          } finally {
            setMissionActionLoadingId((current) => (current === mission.id ? null : current));
          }
          return;
        }

        if (st === 'APPROVED') {
          const rows = await refreshMySubmissions();
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
        refreshMySubmissions,
        getEffectiveSubmissionStatus,
        isVisitante,
        findCachedSubmissionForMission,
        loadMissionsInitial,
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

      const st = getEffectiveSubmissionStatus(mission);
      // Só envia comprovação após accept (ACCEPTED) ou reenvio após reprovação (REJECTED).
      if (st !== 'ACCEPTED' && st !== 'REJECTED') {
        showPopout({
          type: 'warning',
          title: 'Envio não disponível',
          message:
            'Aceite a missão antes de enviar a comprovação, ou aguarde a análise da comprovação anterior.',
        });
        return;
      }

      setEvidenceModal((prev) => ({ ...prev, submitting: true }));
      try {
        const result = await citizenMissionsApi.submitMissionEvidenceSupabaseFromUri(mission.id, uri, {
          mimeType: evidenceModal.mimeType ?? undefined,
          fileName: evidenceModal.fileName ?? undefined,
        });

        const ts = new Date().toISOString();
        setLocalSubmissionStatusByMissionId((prev) => ({ ...prev, [mission.id]: result.status }));
        setMissions((prev) =>
          prev.map((row) => {
            if (row.id !== mission.id) return row;
            const prevSub = row.mySubmission;
            return {
              ...row,
              mySubmission: prevSub
                ? {
                    ...prevSub,
                    id: result.id,
                    status: result.status,
                    updatedAt: ts,
                  }
                : {
                    id: result.id,
                    status: result.status,
                    createdAt: ts,
                    updatedAt: ts,
                  },
            };
          }),
        );

        setSubmissionsCache(null);
        await refreshMySubmissions();
        await loadMissionsInitial();
        closeEvidenceModal();
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
    }, [
      closeEvidenceModal,
      evidenceModal.fileName,
      evidenceModal.mimeType,
      evidenceModal.mission,
      evidenceModal.uri,
      getEffectiveSubmissionStatus,
      loadMissionsInitial,
      refreshMySubmissions,
      showPopout,
    ]);

    const onRefresh = useCallback(async () => {
      try {
        await refreshAll();
      } finally {
      }
    }, [refreshAll]);

    const onPullRefresh = useCallback(async () => {
      setListRefreshing(true);
      try {
        await refreshAll();
      } finally {
        setListRefreshing(false);
      }
    }, [refreshAll]);

    const onMissionsEndReached = useCallback(() => {
      void loadMoreMissions();
    }, [loadMoreMissions]);

    const missionListHeader = useMemo(
      () => (
        <View>
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

          {loading && missions.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.loadingText}>Carregando missões…</Text>
            </View>
          ) : null}

          {errorMessage ? (
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
        </View>
      ),
      [categories, selectedCategory, loading, errorMessage, missions.length, onRefresh],
    );

    const missionListFooter = useMemo(
      () =>
        missionsLoadingMore ? (
          <View style={styles.missionListFooterLoading}>
            <ActivityIndicator color={AppColors.primary} />
          </View>
        ) : null,
      [missionsLoadingMore],
    );

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

        <Pressable
          onPress={onPressRankingHeader}
          style={({ pressed }) => [styles.headerRankingPress, pressed && styles.headerRankingPressPressed]}
          accessibilityRole="button"
          accessibilityLabel="Ver ranking semanal do bairro"
          hitSlop={8}
        >
          <Ionicons name="trophy-outline" size={20} color={AppColors.palette.amber.base} />
          <Text style={styles.headerRankingLabel}>Ranking</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredMissions}
        extraData={{
          submissionsCache,
          missionActionLoadingId,
          localSubmissionStatusByMissionId,
        }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={missionListHeader}
        ListFooterComponent={missionListFooter}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        renderItem={({ item: mission }) => {
          const submissionStatus = getEffectiveSubmissionStatus(mission);
          const isAtCapacity =
            typeof mission.maxParticipants === 'number' &&
            mission.maxParticipants > 0 &&
            Number(mission.participantsCount ?? 0) >= mission.maxParticipants;
          const disableAccept = !submissionStatus && isAtCapacity;
          const cached = submissionsCache?.find((s) => s.mission.id === mission.id) ?? null;
          const note = cached?.note ?? null;
          const evidenceImageUri =
            cached?.evidenceImage?.publicUrl?.trim() ||
            (cached?.evidenceImage?.id
              ? `${getApiBaseUrl()}/api/v1/upload/files/${cached.evidenceImage.id}`
              : null);
          return (
            <View style={styles.missionRow}>
              <MissionCard
                mission={mission}
                submission={
                  submissionStatus
                    ? {
                        status: submissionStatus,
                        note,
                        evidenceImageUri,
                      }
                    : null
                }
                onPressPrimary={() => {
                  if (disableAccept) return;
                  void onPressMissionPrimary(mission);
                }}
                primaryLoading={missionActionLoadingId === mission.id}
                primaryDisabled={disableAccept}
                primaryLabelOverride={disableAccept ? 'Lotada' : undefined}
              />
            </View>
          );
        }}
        contentContainerStyle={[styles.contentContainer, styles.missionFlatListContent]}
        showsVerticalScrollIndicator={false}
        onEndReached={onMissionsEndReached}
        onEndReachedThreshold={0.35}
        refreshControl={
          <RefreshControl
            refreshing={listRefreshing}
            onRefresh={onPullRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={evidenceModal.visible} transparent animationType="slide" onRequestClose={closeEvidenceModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTouchableArea} onPress={closeEvidenceModal} />
          <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {evidenceModalEffectiveStatus === 'APPROVED' ? 'Comprovação' : 'Enviar comprovação'}
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
                {evidenceModalEffectiveStatus !== 'APPROVED' ? (
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

            {evidenceModalEffectiveStatus !== 'APPROVED' ? (
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

            {evidenceModalEffectiveStatus !== 'APPROVED' ? (
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

      <Modal
        visible={rankingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRankingModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTouchableArea} onPress={closeRankingModal} />
          <View style={[styles.bottomSheet, styles.rankingModalSheet, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Ranking da semana</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeRankingModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Fechar ranking"
              >
                <Ionicons name="close" size={24} color={AppColors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.rankingModalScrollContent}
            >
              {weeklyRanking ? (
                <RankingCard
                  weekLabel={weekLabel}
                  rankPosition={weeklyRanking.my?.position ?? null}
                  entries={Array.isArray(weeklyRanking.leaderboard) ? weeklyRanking.leaderboard : []}
                />
              ) : (
                <View style={styles.rankingModalEmpty}>
                  <Ionicons name="podium-outline" size={36} color={AppColors.text.tertiary} />
                  <Text style={styles.rankingModalEmptyText}>
                    Ranking não disponível no momento. Puxe para atualizar a lista.
                  </Text>
                </View>
              )}
            </ScrollView>
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

      <VisitanteLoginOverlay visible={showVisitanteOverlay} message={visitantePromptMessage} />
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
  headerRankingPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingLeft: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerRankingPressPressed: {
    opacity: 0.88,
  },
  headerRankingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  contentContainer: {
    paddingTop: 8,
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
  missionFlatListContent: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 10,
  },
  missionRow: {
    paddingHorizontal: 16,
  },
  missionListFooterLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  rankingModalSheet: {
    maxHeight: '88%',
  },
  rankingModalScrollContent: {
    paddingBottom: 12,
  },
  rankingModalEmpty: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  rankingModalEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
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