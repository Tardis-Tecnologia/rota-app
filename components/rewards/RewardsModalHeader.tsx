import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import RewardFilterChips from './RewardFilterChips';
import RewardsModalBalance from './RewardsModalBalance';
import type { RewardsFilterTab } from '../../types/index';

interface RewardsModalHeaderProps {
  currentPoints: number;
  needsCpf: boolean;
  isLoadingPoints: boolean;
  pointsError: string | null;
  onClose: () => void;
  onRetryLoadPoints: () => void;
  filterTab: RewardsFilterTab;
  onFilterChange: (tab: RewardsFilterTab) => void;
}

export default function RewardsModalHeader({
  currentPoints,
  needsCpf,
  isLoadingPoints,
  pointsError,
  onClose,
  onRetryLoadPoints,
  filterTab,
  onFilterChange,
}: RewardsModalHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Loja de Recompensas</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={AppColors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <RewardsModalBalance
        currentPoints={currentPoints}
        needsCpf={needsCpf}
        isLoadingPoints={isLoadingPoints}
        pointsError={pointsError}
        onRetryLoadPoints={onRetryLoadPoints}
      />

      <RewardFilterChips selected={filterTab} onSelect={onFilterChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
    flexShrink: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 9999,
  },
});
