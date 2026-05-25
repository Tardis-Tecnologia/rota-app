import { AppColors } from '@/constants/theme';
import type { EventCategoryKey } from '@/utils/eventPresentation';
import { EVENT_CATEGORY_FILTERS } from '@/utils/eventPresentation';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type EventCategoryChipsProps = {
  active: EventCategoryKey;
  onSelect: (key: EventCategoryKey) => void;
};

export default function EventCategoryChips({ active, onSelect }: EventCategoryChipsProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {EVENT_CATEGORY_FILTERS.map(({ key, label, icon }) => {
          const isActive = key === active;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(key)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={icon}
                size={16}
                color={isActive ? '#FFFFFF' : AppColors.tab.active}
              />
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 12,
    backgroundColor: AppColors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.25)',
    backgroundColor: AppColors.background.default,
  },
  chipActive: {
    backgroundColor: AppColors.tab.active,
    borderColor: AppColors.tab.active,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
});
