import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  CitizenMissionListItem,
  CitizenMissionSubmissionStatus,
} from '@/services/citizenMissionsApi';

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export type MissionCardSubmission =
  | { status: CitizenMissionSubmissionStatus; note?: string | null }
  | null;

export type MissionCardStatus = 'idle' | 'accepted' | 'active' | 'approved' | 'rejected';

function mapCardStatus(submissionStatus: CitizenMissionSubmissionStatus | null | undefined): MissionCardStatus {
  if (!submissionStatus) return 'idle';
  if (submissionStatus === 'ACCEPTED') return 'accepted';
  if (submissionStatus === 'APPROVED') return 'approved';
  if (submissionStatus === 'REJECTED') return 'rejected';
  return 'active';
}

function missionIconFromTitle(title: string): keyof typeof Ionicons.glyphMap {
  const t = title.toLowerCase();
  if (t.includes('árvore') || t.includes('arvore') || t.includes('plante') || t.includes('planta')) {
    return 'leaf-outline';
  }
  if (t.includes('audiência') || t.includes('audiencia') || t.includes('pública') || t.includes('publica')) {
    return 'people-outline';
  }
  if (t.includes('doe') || t.includes('sangue')) return 'heart-outline';
  if (t.includes('limpeza') || t.includes('mutirão') || t.includes('mutirao')) return 'trash-outline';
  if (t.includes('reporte') || t.includes('report')) return 'megaphone-outline';
  return 'sparkles-outline';
}

function accentFromMissionId(id: string): {
  iconBg: string;
  topAccent: string;
  tagBg: string;
  tagText: string;
} {
  // Paleta determinística para manter consistência visual sem depender do backend.
  const palettes = [
    { iconBg: '#10B981', topAccent: '#10B981', tagBg: '#D1FAE5', tagText: '#047857' },
    { iconBg: '#0EA5E9', topAccent: '#06B6D4', tagBg: '#CFFAFE', tagText: '#0E7490' },
    { iconBg: '#7C3AED', topAccent: '#8B5CF6', tagBg: '#EDE9FE', tagText: '#6D28D9' },
    { iconBg: '#EF4444', topAccent: '#F43F5E', tagBg: '#FEE2E2', tagText: '#B91C1C' },
    { iconBg: '#F59E0B', topAccent: '#F97316', tagBg: '#FEF3C7', tagText: '#92400E' },
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length]!;
}

export function MissionCard({
  mission,
  submission,
  onPressPrimary,
}: {
  mission: Pick<
    CitizenMissionListItem,
    'id' | 'title' | 'description' | 'points' | 'maxParticipants' | 'participantsCount' | 'mySubmission'
  >;
  submission: MissionCardSubmission;
  onPressPrimary: () => void;
}) {
  const status = mapCardStatus(submission?.status ?? mission.mySubmission?.status ?? null);

  const progress = useMemo(() => {
    if (mission.maxParticipants && mission.maxParticipants > 0) {
      const current = Math.max(0, Number(mission.participantsCount ?? 0));
      const total = mission.maxParticipants;
      const percent = total > 0 ? clamp01(current / total) * 100 : 0;
      return { kind: 'participants' as const, current, total, percent };
    }
    // Para missões individuais, default 0/1 (até o usuário enviar).
    if (status === 'approved') return { kind: 'percent' as const, current: 1, total: 1 };
    if (status === 'idle' || status === 'active' || status === 'rejected') {
      return { kind: 'percent' as const, current: 0, total: 1 };
    }
    return null;
  }, [mission.maxParticipants, mission.participantsCount, status]);

  const progressRatio = useMemo(() => {
    if (!progress) return 0;
    if (progress.kind === 'percent') {
      return clamp01(progress.total === 0 ? 0 : progress.current / progress.total);
    }
    return clamp01(progress.percent / 100);
  }, [progress]);

  const progressLeftLabel = useMemo(() => {
    if (!progress) return '';
    if (progress.kind === 'participants') return `${progress.current}/${progress.total} participantes`;
    return `${Math.round(progressRatio * 100)}%`;
  }, [progress, progressRatio]);

  const progressRightLabel = useMemo(() => {
    if (!progress) return '';
    if (progress.kind === 'participants') return `${Math.round(progressRatio * 100)}%`;
    return `${Math.round(progressRatio * 100)}%`;
  }, [progress, progressRatio]);

  const isApproved = status === 'approved';
  const isActive = status === 'active';
  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';
  const accents = useMemo(() => accentFromMissionId(mission.id), [mission.id]);
  const icon = useMemo(() => missionIconFromTitle(mission.title), [mission.title]);

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: accents.topAccent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.iconWrap, { backgroundColor: accents.iconBg }]}>
            <Ionicons name={icon} size={22} color={AppColors.text.white} />
          </View>

          <View style={styles.cardTitleCol}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {mission.title}
            </Text>
          </View>

          <View style={styles.cardMetaCol}>
            <View style={styles.pointsPill}>
              <Text style={styles.pointsPillText}>{`+${mission.points} pts`}</Text>
            </View>
          </View>
        </View>

        {mission.description ? (
          <Text style={styles.cardDescription}>{mission.description}</Text>
        ) : null}

        <View style={[styles.tagPill, { backgroundColor: accents.tagBg }]}>
          <Text style={[styles.tagPillText, { color: accents.tagText }]}>Missão</Text>
        </View>

        {progress ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelLeft}>{progressLeftLabel}</Text>
              <Text style={styles.progressLabelRight}>{progressRightLabel}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
            </View>
          </View>
        ) : null}

        {isRejected && submission?.note ? (
          <View style={styles.rejectedNoteWrap}>
            <Text style={styles.rejectedNoteTitle}>Reprovada</Text>
            <Text style={styles.rejectedNoteText} numberOfLines={3}>
              {submission.note}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          {isApproved ? (
            <View style={styles.approvedRow}>
              <Ionicons name="checkmark-circle" size={18} color={AppColors.status.success} />
              <Text style={styles.approvedText}>Aprovada</Text>
            </View>
          ) : isAccepted ? (
            <View style={styles.acceptedRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={AppColors.primary} />
              <Text style={styles.acceptedText}>Aceita</Text>
            </View>
          ) : isActive ? (
            <View style={styles.activeRow}>
              <Ionicons name="flame-outline" size={18} color={AppColors.report.orange} />
              <Text style={styles.activeText}>Em análise</Text>
            </View>
          ) : isRejected ? (
            <View style={styles.rejectedRow}>
              <Ionicons name="close-circle" size={18} color={AppColors.status.error} />
              <Text style={styles.rejectedText}>Reprovada</Text>
            </View>
          ) : (
            <View style={styles.approvedRow} />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isApproved
                ? 'Ver comprovação'
                : isAccepted
                  ? 'Enviar comprovação'
                  : isActive
                  ? 'Ver status da missão'
                  : isRejected
                    ? 'Reenviar comprovação'
                    : 'Enviar comprovação'
            }
            style={({ pressed }) => [
              isApproved ? styles.secondaryButton : styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onPressPrimary}
          >
            <Text style={isApproved ? styles.secondaryButtonText : styles.primaryButtonText}>
              {isApproved
                ? 'Ver comprovação'
                : isAccepted
                  ? 'Enviar comprovação'
                : isActive
                  ? 'Acompanhar'
                  : isRejected
                    ? 'Reenviar'
                    : 'Aceitar missão'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardAccent: {
    height: 6,
    width: '100%',
  },
  cardBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AppColors.text.secondary,
  },
  cardMetaCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pointsPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },
  pointsPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#047857',
  },
  difficultyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  difficultyPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#334155',
  },
  cardDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  tagPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  progressBlock: {
    marginTop: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabelLeft: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.text.gray,
  },
  progressLabelRight: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.text.gray,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 999,
  },
  cardFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  approvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minHeight: 22,
  },
  approvedText: {
    fontSize: 15,
    fontWeight: '900',
    color: AppColors.status.success,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minHeight: 22,
  },
  activeText: {
    fontSize: 15,
    fontWeight: '900',
    color: AppColors.report.orange,
  },
  acceptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minHeight: 22,
  },
  acceptedText: {
    fontSize: 15,
    fontWeight: '900',
    color: AppColors.primary,
  },
  rejectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minHeight: 22,
  },
  rejectedText: {
    fontSize: 15,
    fontWeight: '900',
    color: AppColors.status.error,
  },
  rejectedNoteWrap: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: AppColors.background.backgroundDanger,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  rejectedNoteTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: AppColors.status.error,
    marginBottom: 4,
  },
  rejectedNoteText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: AppColors.text.white,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#334155',
  },
  buttonPressed: {
    opacity: 0.9,
  },
});

