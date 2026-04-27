import { AppColors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Neighborhood } from '@/data/mockPulso';

export function NeighborhoodPickerCard({
  title,
  query,
  onChangeQuery,
  neighborhoods,
  selectedId,
  onSelect,
}: {
  title: string;
  query: string;
  onChangeQuery: (v: string) => void;
  neighborhoods: Neighborhood[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const chips = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return neighborhoods;
    return neighborhoods.filter((n) => n.name.toLowerCase().includes(q));
  }, [neighborhoods, query]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.search}>
        <Feather name="search" size={18} color={AppColors.text.quaternary} />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Digite um bairro..."
          placeholderTextColor={AppColors.text.quaternary}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.chipsRow}>
        {chips.map((n) => {
          const active = n.id === selectedId;
          return (
            <Pressable
              key={n.id}
              onPress={() => onSelect(n.id)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar bairro ${n.name}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {n.name}
              </Text>
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
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.muted,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: AppColors.background.muted,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  chipActive: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.gray[500],
  },
  chipTextActive: {
    color: AppColors.text.white,
  },
});

