import { AppColors } from '@/constants/theme';
import { getPrematriculaSchoolById } from '@/services/prematriculaSchools';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrematriculaSchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const school = getPrematriculaSchoolById(id ?? '');

  if (!school) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Escola não encontrada.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: school.name }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: school.imageUrl }} style={styles.hero} />
        <View style={styles.card}>
          <Text
            style={[styles.badge, { color: school.badgeColor, backgroundColor: school.badgeBackground }]}
          >
            {school.typeLabel}
          </Text>
          <Text style={styles.name}>{school.name}</Text>
          <Text style={styles.desc}>{school.description}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={AppColors.primary} />
            <Text style={styles.infoText}>{school.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={18} color={AppColors.primary} />
            <Text style={styles.infoText}>{school.region}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={AppColors.primary} />
            <Text style={styles.infoText}>Turnos: {school.shifts.join(', ')}</Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{school.vacanciesAvailable}</Text>
              <Text style={styles.statLabel}>Vagas</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{school.waitlist}</Text>
              <Text style={styles.statLabel}>Na fila</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: '/education/prematricula/formulario',
              params: { schoolId: school.id, schoolName: school.name },
            })
          }
        >
          <Text style={styles.ctaText}>Fazer pré-matrícula</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  hero: {
    width: '100%',
    height: 200,
    backgroundColor: AppColors.background.input,
  },
  card: {
    marginTop: -24,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  name: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.tertiary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  infoText: { flex: 1, fontSize: 14, color: AppColors.text.secondary, lineHeight: 20 },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: AppColors.background.muted,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: AppColors.primary },
  statLabel: { marginTop: 2, fontSize: 12, color: AppColors.text.tertiary },
  cta: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.9 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { color: AppColors.text.tertiary },
});
