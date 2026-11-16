import DocumentDescription from '@/components/DocumentDescription';
import { AppColors } from '@/constants/theme';
import { PREMATRICULA_LEVELS } from '@/services/prematriculaSchools';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const LEVEL_COLORS: Record<string, { bg: string; fg: string }> = {
  creche: { bg: '#fef3c7', fg: '#b45309' },
  fundamental: { bg: '#e0f2fe', fg: '#0369a1' },
  medio: { bg: '#e0e7ff', fg: '#4338ca' },
};

export default function PrematriculaIndexScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Matrícula 2026</Text>
      <Text style={styles.subtitle}>Escolha a etapa e encontre a escola ideal na rede municipal.</Text>

      <View style={styles.list}>
        {PREMATRICULA_LEVELS.map((level) => {
          const colors = LEVEL_COLORS[level.id];
          return (
            <Pressable
              key={level.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                router.push({ pathname: '/education/prematricula/[level]', params: { level: level.id } })
              }
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
                <Ionicons name={level.icon} size={24} color={colors.fg} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{level.title}</Text>
                <Text style={styles.cardDesc}>{level.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
            </Pressable>
          );
        })}
      </View>

      <DocumentDescription />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.text.secondary },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.tertiary,
  },
  list: { gap: 10, marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  cardDesc: { marginTop: 2, fontSize: 13, color: AppColors.text.tertiary },
  pressed: { opacity: 0.88 },
});
