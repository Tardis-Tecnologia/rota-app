import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Mission } from '@/data/mockMissions';

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function MissionCard({ mission }: { mission: Mission }) {
  const progress = mission.progress;
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

  const isApproved = mission.status === 'approved';
  const isActive = mission.status === 'active';

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: mission.topAccent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.iconWrap, { backgroundColor: mission.iconBg }]}>
            <Ionicons name={mission.icon} size={22} color={AppColors.text.white} />
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
            <View style={styles.difficultyPill}>
              <Text style={styles.difficultyPillText}>{mission.difficulty}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.cardDescription}>{mission.description}</Text>

        <View style={[styles.tagPill, { backgroundColor: mission.tagBg }]}>
          <Text style={[styles.tagPillText, { color: mission.tagText }]}>{mission.category}</Text>
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

        <View style={styles.cardFooter}>
          {isApproved ? (
            <View style={styles.approvedRow}>
              <Ionicons name="checkmark-circle" size={18} color={AppColors.status.success} />
              <Text style={styles.approvedText}>Aprovada</Text>
            </View>
          ) : isActive ? (
            <View style={styles.activeRow}>
              <Ionicons name="flame-outline" size={18} color={AppColors.report.orange} />
              <Text style={styles.activeText}>Em andamento</Text>
            </View>
          ) : (
            <View style={styles.approvedRow} />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isApproved ? 'Ver comprovação' : isActive ? 'Continuar missão' : 'Aceitar Missão'
            }
            style={({ pressed }) => [
              isApproved ? styles.secondaryButton : styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={isApproved ? styles.secondaryButtonText : styles.primaryButtonText}>
              {isApproved ? 'Ver comprovação' : isActive ? 'Continuar' : 'Aceitar Missão'}
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

