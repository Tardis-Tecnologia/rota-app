import FilterTabs, { type FilterOption } from '@/components/FilterTabs';
import { AppColors } from '@/constants/theme';
import { FeedFilter } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const FILTERS: FilterOption[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'noticias', label: 'Notícias' },
  { key: 'enquetes', label: 'Enquetes' },
  { key: 'obras', label: 'Obras' },
  { key: 'lazer', label: 'Lazer' },
];

interface FeedMuralHeaderProps {
  activeFilter: FeedFilter;
  onSelectFilter: (key: FeedFilter) => void;
}

export default function FeedMuralHeader({ activeFilter, onSelectFilter }: FeedMuralHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View style={styles.titleIcon}>
          <Ionicons name="megaphone-outline" size={20} color="#1d4ed8" />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Novidades da Prefeitura</Text>
          <Text style={styles.subtitle}>Comunicados e avisos oficiais — leia aqui no app</Text>
        </View>
      </View>

      <FilterTabs
        filters={FILTERS}
        active={activeFilter}
        onSelect={(key) => onSelectFilter(key as FeedFilter)}
        compact
        edgeToEdge
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 8,
    borderBottomColor: '#EEF2F7',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleBlock: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
    lineHeight: 26,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.text.tertiary,
  },
});
