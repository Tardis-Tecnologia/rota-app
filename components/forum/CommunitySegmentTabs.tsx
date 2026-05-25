import { AppColors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface CommunitySegmentOption {
  key: string;
  label: string;
}

interface CommunitySegmentTabsProps {
  options: CommunitySegmentOption[];
  active: string;
  onSelect: (key: string) => void;
}

export default function CommunitySegmentTabs({
  options,
  active,
  onSelect,
}: CommunitySegmentTabsProps) {
  return (
    <View style={styles.wrap}>
      {options.map(({ key, label }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: AppColors.background.default,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
  },
  labelActive: {
    color: '#0891b2',
    fontWeight: '800',
  },
});
