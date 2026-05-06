import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { CatalogReward } from '../../types/index';

interface RewardEarnPointsCardProps {
  reward: CatalogReward;
  isLoading: boolean;
  onRedeem: (rewardId: string, value: number) => void;
}

export default function RewardEarnPointsCard({
  reward,
  isLoading,
  onRedeem,
}: RewardEarnPointsCardProps) {
  const pts = reward.value ?? 0;
  const disabled = Boolean(reward.disabled) || isLoading;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={3}>
          {reward.name}
        </Text>
        {reward.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {reward.description}
          </Text>
        ) : null}
        <View style={styles.pointsRow}>
          <Ionicons name="star" size={18} color={AppColors.palette.purple.base} />
          <Text style={styles.pointsText}>+{pts.toLocaleString('pt-BR')} pontos</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={() => {
          void onRedeem(reward.id, pts);
        }}
        disabled={disabled}
        activeOpacity={0.75}
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {isLoading ? 'Resgatando…' : 'Resgatar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginBottom: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsText: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.palette.purple.base,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
    backgroundColor: AppColors.palette.purple.base,
  },
  buttonDisabled: {
    backgroundColor: AppColors.gray[300],
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.text.white,
  },
  buttonTextDisabled: {
    color: AppColors.text.tertiary,
  },
});
