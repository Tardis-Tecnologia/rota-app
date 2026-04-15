import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { CatalogReward } from '../../types/index';

interface RewardCatalogCardProps {
  reward: CatalogReward;
  isRedeemed: boolean;
  isLoading: boolean;
  onRedeem: (rewardId: string, value: number) => void;
}

export default function RewardCatalogCard({
  reward,
  isRedeemed,
  isLoading,
  onRedeem,
}: RewardCatalogCardProps) {
  const disabled = Boolean(reward.disabled) || isRedeemed || isLoading;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{reward.name}</Text>
        {reward.description ? (
          <Text style={styles.description}>{reward.description}</Text>
        ) : null}
        <View style={styles.costRow}>
          <Ionicons name="star-outline" size={16} color={AppColors.palette.purple.base} />
          <Text style={styles.costText}>{(reward.value ?? 0).toLocaleString('pt-BR')}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={() => {
          void onRedeem(reward.id, reward.value ?? 0);
        }}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {isLoading ? 'Resgatando...' : isRedeemed ? 'Resgatado' : 'Resgatar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginBottom: 6,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.palette.purple.base,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: AppColors.palette.purple.base,
  },
  buttonDisabled: {
    backgroundColor: AppColors.gray[200],
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text.white,
  },
  buttonTextDisabled: {
    color: AppColors.text.tertiary,
  },
});
