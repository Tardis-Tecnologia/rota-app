import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PulseTrend } from '@/data/mockPulso';

function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1).replace('.', ',')}`;
}

export function TrendsCard({ trends }: { trends: PulseTrend[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>TENDÊNCIAS DA SEMANA</Text>

      <View style={styles.list}>
        {trends.map((t) => {
          const delta = t.delta;
          const hasDelta = delta !== null && !Number.isNaN(delta);
          const positive = hasDelta && (delta as number) >= 0;
          const color = !hasDelta
            ? AppColors.text.quaternary
            : positive
              ? AppColors.status.success
              : AppColors.status.error;
          const icon = !hasDelta
            ? 'remove-outline'
            : positive
              ? 'trending-up-outline'
              : 'trending-down-outline';
          return (
            <View key={t.key} style={styles.row}>
              <Text style={styles.label}>{t.label}</Text>
              <View style={styles.deltaWrap}>
                <Ionicons name={icon} size={16} color={color} />
                <Text style={[styles.delta, { color }]}>
                  {!hasDelta ? 'Sem dados na semana' : `${formatDelta(delta as number)} vs semana passada`}
                </Text>
              </View>
            </View>
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: AppColors.background.muted,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  deltaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  delta: {
    fontSize: 13,
    fontWeight: '900',
  },
});

