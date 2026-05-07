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
  /** Atalho para a aba de cupons (ícone da lojinha). */
  onStorePress?: () => void;
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
  onStorePress,
}: RewardsModalHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Loja de Recompensas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBadge}
            onPress={() => {
              if (onStorePress) {
                onStorePress();
              } else {
                onFilterChange('cupons_lojas');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Abrir loja de cupons"
            accessibilityHint="Lojinha de cupons"
            activeOpacity={0.75}
          >
            <Ionicons name="storefront-outline" size={20} color="#7e22ce" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#4b5563" />
          </TouchableOpacity>
        </View>
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
    fontWeight: '700',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 9999,
  },
});
