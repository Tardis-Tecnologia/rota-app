import { AppColors } from '@/constants/theme';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PulseCategory } from '@/data/mockPulso';

type RatingOption = {
  key: 1 | 2 | 3 | 4 | 5;
  label: string;
  emoji: string;
  accent: string;
};

const OPTIONS: RatingOption[] = [
  { key: 1, label: 'Péssimo', emoji: '😡', accent: AppColors.status.error },
  { key: 2, label: 'Ruim', emoji: '😕', accent: '#F97316' },
  { key: 3, label: 'Regular', emoji: '🙂', accent: AppColors.status.warning },
  { key: 4, label: 'Bom', emoji: '😊', accent: AppColors.status.info },
  { key: 5, label: 'Ótimo', emoji: '😍', accent: AppColors.status.success },
];

function formatNote(v: number): string {
  const clipped = Math.max(0, Math.min(5, v));
  return clipped.toFixed(1).replace('.', ',');
}

export function CategoryRatingCard({
  category,
  selected,
  onSelect,
}: {
  category: PulseCategory;
  selected?: 1 | 2 | 3 | 4 | 5;
  onSelect: (value: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const badgeText = useMemo(() => `Nota: ${formatNote(category.note)}`, [category.note]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{category.label}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </View>

      <View style={styles.optionsRow}>
        {OPTIONS.map((opt) => {
          const active = selected === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              style={({ pressed }) => [
                styles.option,
                active && { borderColor: opt.accent, backgroundColor: `${opt.accent}14` },
                pressed && styles.optionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${category.label}: ${opt.label}`}
            >
              <Text style={styles.emoji} accessibilityLabel={opt.label}>
                {opt.emoji}
              </Text>
              <Text style={[styles.optionLabel, active && { color: opt.accent }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: AppColors.text.secondary,
    flex: 1,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: AppColors.palette.sky.light,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: AppColors.palette.sky.base,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.default,
  },
  optionPressed: {
    opacity: 0.9,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.text.tertiary,
  },
});

