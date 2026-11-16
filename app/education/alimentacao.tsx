import { AppColors } from '@/constants/theme';
import { mockMenus, mockSchools } from '@/services/educationMocks';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AlimentacaoScreen() {
  const schools = mockSchools;
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? '');
  const days = useMemo(
    () => Array.from(new Set(mockMenus.map((m) => m.date))).sort(),
    [],
  );
  const [day, setDay] = useState(days[0] ?? '');

  const meals = mockMenus.filter((m) => m.date === day);
  const school = schools.find((s) => s.id === schoolId);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Escola</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {schools.map((s) => (
          <Pressable
            key={s.id}
            style={[styles.chip, schoolId === s.id && styles.chipActive]}
            onPress={() => setSchoolId(s.id)}
          >
            <Text style={[styles.chipText, schoolId === s.id && styles.chipTextActive]} numberOfLines={1}>
              {s.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.hint}>{school?.name}</Text>

      <Text style={styles.section}>Dias da semana</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {days.map((d) => (
          <Pressable
            key={d}
            style={[styles.chip, day === d && styles.chipActive]}
            onPress={() => setDay(d)}
          >
            <Text style={[styles.chipText, day === d && styles.chipTextActive]}>
              {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
              })}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {meals.map((meal) => (
        <View key={meal.id} style={styles.card}>
          <Text style={styles.meal}>{meal.meal}</Text>
          <Text style={styles.desc}>{meal.description}</Text>
        </View>
      ))}

      {meals.length === 0 ? (
        <Text style={styles.empty}>Sem cardápio para o dia selecionado.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  section: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
  },
  chips: { flexGrow: 0, marginBottom: 12 },
  chip: {
    marginRight: 8,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: AppColors.text.tertiary },
  chipTextActive: { color: '#fff' },
  hint: { marginBottom: 12, fontSize: 13, color: AppColors.text.secondary, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  meal: { fontSize: 14, fontWeight: '800', color: AppColors.primary },
  desc: { marginTop: 6, fontSize: 14, lineHeight: 20, color: AppColors.text.secondary },
  empty: { color: AppColors.text.tertiary, marginTop: 8 },
});
