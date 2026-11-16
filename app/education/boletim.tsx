import StatusBadge from '@/components/education/StatusBadge';
import { AppColors } from '@/constants/theme';
import { mockStudent } from '@/services/educationMocks';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function BoletimScreen() {
  const periods = useMemo(
    () => Array.from(new Set(mockStudent.grades.map((g) => g.period))),
    [],
  );
  const subjects = useMemo(
    () => Array.from(new Set(mockStudent.grades.map((g) => g.subject))),
    [],
  );

  const rows = subjects.map((subject) => {
    const byPeriod = periods.map((period) => {
      const found = mockStudent.grades.find((g) => g.subject === subject && g.period === period);
      return found?.grade ?? null;
    });
    const valid = byPeriod.filter((n): n is number => n != null);
    const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    return { subject, byPeriod, avg };
  });

  const overall =
    rows.length === 0 ? 0 : rows.reduce((acc, row) => acc + row.avg, 0) / rows.length;

  return (
    <ScrollView contentContainerStyle={styles.content} horizontal={false}>
      <View style={styles.headerCard}>
        <Text style={styles.name}>{mockStudent.name}</Text>
        <Text style={styles.meta}>
          {mockStudent.school.name} · {mockStudent.series}
        </Text>
        <Text style={styles.meta}>Ano letivo 2026</Text>
        <View style={styles.avgRow}>
          <Text style={styles.avgLabel}>Média geral</Text>
          <Text style={styles.avgValue}>{overall.toFixed(1)}</Text>
          <StatusBadge status={overall >= 7 ? 'APPROVED' : 'PENDING'} label={overall >= 7 ? 'Aprovado' : 'Em recuperação'} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.colSubject]}>Disciplina</Text>
            {periods.map((p) => (
              <Text key={p} style={[styles.th, styles.colGrade]}>
                {p.replace(' bimestre', '')}
              </Text>
            ))}
            <Text style={[styles.th, styles.colGrade]}>Média</Text>
          </View>
          {rows.map((row) => (
            <View key={row.subject} style={styles.tr}>
              <Text style={[styles.td, styles.colSubject]}>{row.subject}</Text>
              {row.byPeriod.map((grade, index) => (
                <Text
                  key={`${row.subject}-${index}`}
                  style={[
                    styles.td,
                    styles.colGrade,
                    grade != null && grade < 7 ? styles.low : null,
                  ]}
                >
                  {grade == null ? '—' : grade.toFixed(1)}
                </Text>
              ))}
              <Text style={[styles.td, styles.colGrade, styles.bold]}>{row.avg.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  name: { fontSize: 18, fontWeight: '800', color: AppColors.text.secondary },
  meta: { marginTop: 4, fontSize: 13, color: AppColors.text.tertiary },
  avgRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avgLabel: { fontSize: 13, color: AppColors.text.tertiary },
  avgValue: { fontSize: 22, fontWeight: '800', color: AppColors.primary },
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  thead: { backgroundColor: '#f8fafc' },
  th: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: '800',
    color: AppColors.text.tertiary,
  },
  td: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 13,
    color: AppColors.text.secondary,
  },
  colSubject: { width: 110 },
  colGrade: { width: 72, textAlign: 'center' },
  bold: { fontWeight: '800' },
  low: { color: '#c2410c', fontWeight: '700' },
});
