import { AppColors } from '@/constants/theme';
import { mockStudent } from '@/services/educationMocks';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function FrequenciaScreen() {
  const [period, setPeriod] = useState<'all' | string>('all');
  const months = mockStudent.attendance;

  const filteredMonths = period === 'all' ? months : months.filter((m) => m.month === period);

  const totals = useMemo(() => {
    const presences = filteredMonths.reduce((a, m) => a + m.presences, 0);
    const absences = filteredMonths.reduce((a, m) => a + m.absences, 0);
    const classes = presences + absences;
    const percent = classes ? Math.round((presences / classes) * 100) : 0;
    return { presences, absences, classes, percent };
  }, [filteredMonths]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.percent}>{totals.percent}%</Text>
        <Text style={styles.percentLabel}>Frequência</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totals.classes}</Text>
            <Text style={styles.statLabel}>Aulas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totals.presences}</Text>
            <Text style={styles.statLabel}>Presenças</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.absence]}>{totals.absences}</Text>
            <Text style={styles.statLabel}>Faltas</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <Pressable
          style={[styles.chip, period === 'all' && styles.chipActive]}
          onPress={() => setPeriod('all')}
        >
          <Text style={[styles.chipText, period === 'all' && styles.chipTextActive]}>Todos</Text>
        </Pressable>
        {months.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.chip, period === m.month && styles.chipActive]}
            onPress={() => setPeriod(m.month)}
          >
            <Text style={[styles.chipText, period === m.month && styles.chipTextActive]}>
              {m.month}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.section}>Histórico mensal</Text>
      {filteredMonths.map((m) => (
        <View key={m.id} style={styles.monthCard}>
          <Text style={styles.month}>{m.month}</Text>
          <Text style={styles.monthMeta}>
            {m.presences} presenças · {m.absences} faltas
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  summary: {
    backgroundColor: AppColors.primary,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  percent: { fontSize: 40, fontWeight: '800', color: '#fff' },
  percentLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 18, marginTop: 14 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  absence: { color: '#fecaca' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  chips: { flexGrow: 0, marginBottom: 8 },
  chip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: AppColors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: AppColors.text.tertiary },
  chipTextActive: { color: '#fff' },
  section: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
  },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  month: { fontWeight: '700', color: AppColors.text.secondary },
  monthMeta: { marginTop: 2, fontSize: 13, color: AppColors.text.tertiary },
});
