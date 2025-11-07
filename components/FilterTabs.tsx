import { AppColors } from '@/constants/theme';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface FilterOption {
  key: string;
  label: string;
}

interface FilterTabsProps {
  filters: FilterOption[];
  active: string;
  onSelect: (key: string) => void;
  containerStyle?: ViewStyle;
}

export default function FilterTabs({ filters, active, onSelect, containerStyle }: FilterTabsProps) {
  return (
    <View style={[styles.filtersWrapper, containerStyle]}>
      <View style={styles.filtersContainerBg}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map(({ key, label }) => {
            const isActive = key === active;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => onSelect(key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filtersWrapper: {
    paddingBottom: 12,
  },
  filtersContainerBg: {
    backgroundColor: AppColors.feed.filterBackground,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  filtersContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.feed.filterButton,
  },
  filterButtonActive: {
    backgroundColor: AppColors.feed.filterActive,
    borderColor: AppColors.feed.filterActive,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.feed.filterText,
  },
  filterLabelActive: {
    color: AppColors.text.white,
  },
});

