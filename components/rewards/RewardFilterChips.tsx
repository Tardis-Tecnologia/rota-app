import { AppColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RewardsFilterTab } from '../../types/index';
import { REWARDS_STORE_TABS } from '../../types/index';

interface RewardFilterChipsProps {
  selected: RewardsFilterTab;
  onSelect: (tab: RewardsFilterTab) => void;
}

export default function RewardFilterChips({ selected, onSelect }: RewardFilterChipsProps) {
  return (
    <View style={styles.segment}>
      {REWARDS_STORE_TABS.map((tab) => {
        const isActive = selected === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.segmentItem, isActive && styles.segmentItemActive]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.88}
          >
            <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    marginTop: 12,
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    gap: 0,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: AppColors.background.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
  },
  segmentLabelActive: {
    color: '#1f2937',
  },
});
