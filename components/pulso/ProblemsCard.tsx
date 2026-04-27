import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PulseProblem } from '@/data/mockPulso';

export function ProblemsCard({ problems }: { problems: PulseProblem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>PROBLEMAS MAIS REPORTADOS</Text>

      <View style={styles.list}>
        {problems.map((p) => (
          <View key={p.id} style={styles.row}>
            <View style={styles.left}>
              <View style={styles.iconWrap}>
                <Ionicons name="warning-outline" size={18} color={AppColors.palette.orange.base} />
              </View>
              <Text style={styles.label}>{p.label}</Text>
            </View>
            <Text style={styles.count}>{p.reports} relatos</Text>
          </View>
        ))}
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
    color: AppColors.text.secondary,
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#9A5B06',
  },
  count: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
});

