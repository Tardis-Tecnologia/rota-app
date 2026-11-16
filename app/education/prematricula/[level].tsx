import { AppColors } from '@/constants/theme';
import {
  getPrematriculaSchoolsByLevel,
  prematriculaLevelTitle,
  type PrematriculaLevel,
} from '@/services/prematriculaSchools';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function PrematriculaLevelScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const safeLevel = (level as PrematriculaLevel) || 'creche';
  const schools = useMemo(() => getPrematriculaSchoolsByLevel(safeLevel), [safeLevel]);
  const title = prematriculaLevelTitle(safeLevel);

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View style={styles.container}>
        <FlatList
          data={schools}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma escola encontrada para esta etapa.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: '/education/prematricula/escola/[id]',
                  params: { id: item.id },
                })
              }
            >
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <View style={styles.body}>
                <Text
                  style={[styles.badge, { color: item.badgeColor, backgroundColor: item.badgeBackground }]}
                >
                  {item.typeLabel}
                </Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.address} numberOfLines={2}>
                  {item.address}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons name="people-outline" size={13} color="#047857" />
                    <Text style={styles.metaText}>
                      {item.vacanciesAvailable > 0
                        ? `${item.vacanciesAvailable} vaga(s)`
                        : 'Sem vagas'}
                    </Text>
                  </View>
                  {item.waitlist > 0 ? (
                    <View style={[styles.metaChip, styles.waitChip]}>
                      <Text style={styles.waitText}>Fila {item.waitlist}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
            </Pressable>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: AppColors.background.input,
  },
  body: { flex: 1, minWidth: 0 },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  name: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  address: {
    marginTop: 2,
    fontSize: 12,
    color: AppColors.text.tertiary,
    lineHeight: 16,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  metaText: { fontSize: 11, fontWeight: '700', color: '#047857' },
  waitChip: { backgroundColor: '#fef3c7' },
  waitText: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  empty: { textAlign: 'center', color: AppColors.text.tertiary, marginTop: 40 },
  pressed: { opacity: 0.88 },
});
