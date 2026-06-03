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
  /** Menos padding e sem sombra forte — útil na aba Comunidade. */
  compact?: boolean;
  /** Barra de filtros de ponta a ponta, sem margem lateral no container. */
  edgeToEdge?: boolean;
  /** Estilo timeline (Início): fundo branco, chips estilo feed. */
  variant?: 'default' | 'feedTimeline';
}

export default function FilterTabs({
  filters,
  active,
  onSelect,
  containerStyle,
  compact,
  edgeToEdge,
  variant = 'default',
}: FilterTabsProps) {
  const isTimeline = variant === 'feedTimeline';

  return (
    <View
      style={[
        styles.filtersWrapper,
        compact && styles.filtersWrapperCompact,
        isTimeline && styles.filtersWrapperTimeline,
        containerStyle,
      ]}
    >
      <View
        style={[
          styles.filtersContainerBg,
          compact && styles.filtersContainerBgCompact,
          edgeToEdge && styles.filtersContainerBgEdgeToEdge,
          isTimeline && styles.filtersContainerBgTimeline,
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filtersContent,
            edgeToEdge && styles.filtersContentEdgeToEdge,
          ]}
        >
          {filters.map(({ key, label }) => {
            const isActive = key === active;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterButton,
                  isTimeline && styles.filterButtonTimeline,
                  isActive && styles.filterButtonActive,
                  isActive && isTimeline && styles.filterButtonActiveTimeline,
                ]}
                onPress={() => onSelect(key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    isTimeline && styles.filterLabelTimeline,
                    isActive && styles.filterLabelActive,
                    isActive && isTimeline && styles.filterLabelActiveTimeline,
                  ]}
                >
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
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: 12,
  },
  filtersWrapperCompact: {
    paddingBottom: 4,
  },
  filtersWrapperTimeline: {
    paddingBottom: 0,
  },
  filtersContainerBg: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: AppColors.feed.filterBackground,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  filtersContainerBgCompact: {
    paddingVertical: 6,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  filtersContainerBgEdgeToEdge: {
    paddingHorizontal: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  filtersContainerBgTimeline: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowOpacity: 0,
    elevation: 0,
  },
  filtersContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filtersContentEdgeToEdge: {
    paddingHorizontal: 12,
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
  filterButtonTimeline: {
    backgroundColor: '#ffffff',
    borderColor: '#cfd9de',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  filterButtonActive: {
    backgroundColor: AppColors.feed.filterActive,
    borderColor: AppColors.feed.filterActive,
  },
  filterButtonActiveTimeline: {
    backgroundColor: '#1d9bf0',
    borderColor: '#1d9bf0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.feed.filterText,
  },
  filterLabelTimeline: {
    color: '#0f1419',
    fontWeight: '700',
  },
  filterLabelActive: {
    color: AppColors.text.white,
  },
  filterLabelActiveTimeline: {
    color: '#ffffff',
  },
});

