import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ForumFeedContextChipProps {
  label: string;
  onClear?: () => void;
  onPress?: () => void;
}

export default function ForumFeedContextChip({
  label,
  onClear,
  onPress,
}: ForumFeedContextChipProps) {
  return (
    <View style={styles.chipRow}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.chip, pressed && onPress && styles.chipPressed]}
      >
        <Ionicons
          name={onClear ? 'radio-button-on' : 'newspaper-outline'}
          size={14}
          color="#0e7490"
        />
        <Text style={styles.chipText} numberOfLines={1}>
          {label}
        </Text>
        {onPress ? (
          <Ionicons name="chevron-forward" size={14} color={AppColors.text.quaternary} />
        ) : null}
      </Pressable>
      {onClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          style={({ pressed }) => [styles.chipClear, pressed && styles.chipPressed]}
          accessibilityLabel="Limpar filtro"
        >
          <Ionicons name="close-circle" size={22} color={AppColors.text.quaternary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    minWidth: 0,
  },
  chipPressed: { opacity: 0.85 },
  chipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0e7490',
  },
  chipClear: { padding: 2 },
});
