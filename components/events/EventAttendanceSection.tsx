import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import {
  cancelEventAttendance,
  confirmEventAttendance,
  EventAttendanceApiError,
  type EventParticipant,
  type MyEventAttendance,
} from '@/services/eventAttendancesService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type EventAttendanceSectionProps = {
  eventId: string;
  eventStatus: string;
  capacity: number | null;
  attendanceCount: number;
  myAttendance: MyEventAttendance | null;
  participants: EventParticipant[];
  loading: boolean;
  onRefresh: () => Promise<void>;
};

function formatCountLabel(count: number): string {
  if (count === 0) return 'Ninguém confirmou presença ainda';
  if (count === 1) return '1 pessoa confirmou presença';
  return `${count} pessoas confirmaram presença`;
}

function formatCapacityLine(count: number, capacity: number | null): string | null {
  if (capacity != null && capacity > 0) {
    return `${count} / ${capacity} confirmados`;
  }
  return null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ParticipantAvatar({ participant, size = 36 }: { participant: EventParticipant; size?: number }) {
  const photo = participant.photoUrl?.trim();
  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.34 }]}>{initials(participant.name)}</Text>
    </View>
  );
}

export default function EventAttendanceSection({
  eventId,
  eventStatus,
  capacity,
  attendanceCount,
  myAttendance,
  participants,
  loading,
  onRefresh,
}: EventAttendanceSectionProps) {
  const { user } = useAuth();
  const isVisitante = useIsVisitante();
  const [actionLoading, setActionLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const isPublished = eventStatus.trim().toLowerCase() === 'published';
  const isConfirmed = myAttendance?.status === 'confirmed';
  const preview = participants.slice(0, 5);
  const atCapacity =
    capacity != null && capacity > 0 && attendanceCount >= capacity && !isConfirmed;
  const capacityLine = formatCapacityLine(attendanceCount, capacity);

  const runAttendanceAction = useCallback(async () => {
    setActionLoading(true);
    try {
      if (isConfirmed) {
        await cancelEventAttendance(eventId);
      } else {
        await confirmEventAttendance(eventId);
      }
      await onRefresh();
    } catch (e) {
      const message =
        e instanceof EventAttendanceApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Não foi possível atualizar sua presença.';
      Alert.alert('Presença', message);
    } finally {
      setActionLoading(false);
    }
  }, [eventId, isConfirmed, onRefresh]);

  const handleAction = useCallback(() => {
    if (!user) {
      Alert.alert('Entrar na conta', 'Faça login para confirmar presença no evento.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir para login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (isVisitante) {
      promptVisitanteLogin('confirmar presença no evento');
      return;
    }
    if (!isPublished) {
      Alert.alert('Indisponível', 'Este evento ainda não está aberto para confirmação de presença.');
      return;
    }
    if (actionLoading) return;

    if (isConfirmed) {
      Alert.alert('Cancelar presença', 'Deseja cancelar sua confirmação neste evento?', [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, cancelar', style: 'destructive', onPress: () => void runAttendanceAction() },
      ]);
      return;
    }

    void runAttendanceAction();
  }, [actionLoading, isConfirmed, isPublished, isVisitante, runAttendanceAction, user]);

  const primaryLabel = isConfirmed ? 'Confirmado' : 'Vou';
  const showCancelAction = isConfirmed;

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <Ionicons name="people-outline" size={18} color={AppColors.tab.active} />
        <Text style={styles.sectionTitle}>Quem vai</Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={AppColors.tab.active} />
        </View>
      ) : (
        <>
          <Text style={styles.countText}>{formatCountLabel(attendanceCount)}</Text>
          {capacityLine ? <Text style={styles.capacityHint}>{capacityLine}</Text> : null}
          {atCapacity ? <Text style={styles.fullHint}>Evento lotado</Text> : null}
          {!isPublished ? (
            <Text style={styles.unpublishedHint}>
              Confirmação de presença disponível quando o evento estiver publicado.
            </Text>
          ) : null}

          {preview.length > 0 ? (
            <View style={styles.previewRow}>
              <View style={styles.avatarStack}>
                {preview.map((p, index) => (
                  <View
                    key={p.userId}
                    style={[styles.avatarStackItem, index > 0 && { marginLeft: -10 }]}
                  >
                    <ParticipantAvatar participant={p} size={34} />
                  </View>
                ))}
              </View>
              {participants.length > 0 ? (
                <Pressable style={styles.seeAllBtn} onPress={() => setModalVisible(true)}>
                  <Text style={styles.seeAllText}>Ver quem vai</Text>
                  <Ionicons name="chevron-forward" size={16} color={AppColors.tab.active} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!user || isVisitante ? (
            <Text style={styles.loginHint}>
              {isVisitante
                ? 'Faça login com uma conta cadastrada para confirmar presença.'
                : 'Entre na sua conta para confirmar presença.'}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              isConfirmed ? styles.actionBtnConfirmed : styles.actionBtnPrimary,
              (pressed || actionLoading || atCapacity || !isPublished) && styles.actionBtnPressed,
              (atCapacity && !isConfirmed) || !isPublished ? styles.actionBtnDisabled : null,
            ]}
            onPress={() => void handleAction()}
            disabled={actionLoading || (atCapacity && !isConfirmed) || !isPublished}
          >
            {actionLoading ? (
              <ActivityIndicator
                size="small"
                color={isConfirmed ? AppColors.tab.active : '#FFFFFF'}
              />
            ) : (
              <>
                <Ionicons
                  name={isConfirmed ? 'checkmark-circle' : 'hand-right-outline'}
                  size={20}
                  color={isConfirmed ? AppColors.tab.active : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    isConfirmed ? styles.actionBtnTextConfirmed : styles.actionBtnTextPrimary,
                  ]}
                >
                  {primaryLabel}
                </Text>
              </>
            )}
          </Pressable>

          {showCancelAction ? (
            <Pressable
              style={({ pressed }) => [styles.cancelLink, pressed && styles.actionBtnPressed]}
              onPress={() => void handleAction()}
              disabled={actionLoading}
            >
              <Text style={styles.cancelLinkText}>Cancelar minha presença</Text>
            </Pressable>
          ) : null}
        </>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quem vai ao evento</Text>
              <Pressable hitSlop={8} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={AppColors.text.secondary} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>{formatCountLabel(attendanceCount)}</Text>
            {capacityLine ? <Text style={styles.modalCapacity}>{capacityLine}</Text> : null}
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {participants.length === 0 ? (
                <Text style={styles.modalEmpty}>Ainda não há confirmações.</Text>
              ) : (
                participants.map((p) => (
                  <View key={p.userId} style={styles.participantRow}>
                    <ParticipantAvatar participant={p} size={44} />
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {p.confirmedAt ? (
                        <Text style={styles.participantMeta}>
                          Confirmou em{' '}
                          {new Date(p.confirmedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  countText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  capacityHint: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.tab.active,
    marginTop: -6,
  },
  fullHint: {
    fontSize: 13,
    color: '#b45309',
    fontWeight: '600',
  },
  unpublishedHint: {
    fontSize: 13,
    color: AppColors.gray[500],
    lineHeight: 18,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarStackItem: {
    borderWidth: 2,
    borderColor: AppColors.background.default,
    borderRadius: 20,
    backgroundColor: AppColors.background.default,
  },
  avatarFallback: {
    backgroundColor: AppColors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.tab.active,
  },
  loginHint: {
    fontSize: 13,
    color: AppColors.gray[500],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionBtnPrimary: {
    backgroundColor: AppColors.tab.active,
  },
  actionBtnConfirmed: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: AppColors.tab.active,
  },
  actionBtnPressed: {
    opacity: 0.88,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionBtnTextPrimary: {
    color: '#FFFFFF',
  },
  actionBtnTextConfirmed: {
    color: AppColors.tab.active,
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.gray[500],
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: AppColors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '78%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: AppColors.gray[500],
  },
  modalCapacity: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.tab.active,
    marginBottom: 8,
  },
  modalList: {
    maxHeight: 400,
  },
  modalEmpty: {
    fontSize: 14,
    color: AppColors.gray[500],
    paddingVertical: 24,
    textAlign: 'center',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  participantInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  participantMeta: {
    fontSize: 12,
    color: AppColors.gray[500],
  },
});
