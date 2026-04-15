import { AppColors } from '@/constants/theme';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import type { RewardsFilterTab } from '../../types/index';
import { FILTER_CHIPS } from '../../types/index';

interface RewardFilterChipsProps {
  selected: RewardsFilterTab;
  onSelect: (tab: RewardsFilterTab) => void;
}

export default function RewardFilterChips({ selected, onSelect }: RewardFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.row}
    >
      {FILTER_CHIPS.map((chip) => (
        <TouchableOpacity
          key={chip.key}
          onPress={() => onSelect(chip.key)}
          style={[styles.chip, selected === chip.key && styles.chipActive]}
          activeOpacity={0.85}
        >
          <Text style={[styles.chipText, selected === chip.key && styles.chipTextActive]}>
            {chip.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 12,
    maxHeight: 52,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    backgroundColor: AppColors.background.default,
    marginRight: 8,
  },
  chipActive: {
    borderColor: AppColors.palette.purple.base,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  chipTextActive: {
    color: AppColors.palette.purple.base,
  },
});
