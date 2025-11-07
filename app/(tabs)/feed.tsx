import FilterTabs, { FilterOption } from '@/components/FilterTabs';
import NewsPosts from '@/components/NewsPosts';
import { AppColors } from '@/constants/theme';
import { FeedFilter } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const FILTERS: Array<FilterOption> = [
  { key: 'todos', label: 'Todos' },
  { key: 'noticias', label: 'Notícias' },
  { key: 'obras', label: 'Obras' },
  { key: 'lazer', label: 'Lazer' },
];

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('todos');

  const handleSelectFilter = (filterKey: string) => {
    setActiveFilter(filterKey as FeedFilter);
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <FilterTabs filters={FILTERS} active={activeFilter} onSelect={handleSelectFilter} />
          <NewsPosts filter={activeFilter} />
        </ScrollView>
      </View>
      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => {}}>
        <MaterialIcons name="add-circle-outline" size={28} color={AppColors.text.white} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});

