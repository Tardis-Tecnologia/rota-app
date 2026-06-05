import { AppColors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MarketplaceSegment = 'todos' | 'meus';

interface MarketplaceSegmentTabsProps {
  active: MarketplaceSegment;
  onChange: (segment: MarketplaceSegment) => void;
}

export default function MarketplaceSegmentTabs({ active, onChange }: MarketplaceSegmentTabsProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange('todos')}
        style={[styles.tab, active === 'todos' && styles.tabActive]}
      >
        <Text style={[styles.tabText, active === 'todos' && styles.tabTextActive]}>
          TODOS OS PRODUTOS
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('meus')}
        style={[styles.tab, active === 'meus' && styles.tabActive]}
      >
        <Text style={[styles.tabText, active === 'meus' && styles.tabTextActive]}>MINHA LOJA</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: AppColors.text.tertiary,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#fff',
  },
});
