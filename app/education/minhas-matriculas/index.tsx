import StatusBadge from '@/components/education/StatusBadge';
import { AppColors } from '@/constants/theme';
import { mockEnrollments } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MinhasMatriculasScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Alunos vinculados ao responsável. Consulte matrícula, escola, série, documentos e pendências.
      </Text>
      {mockEnrollments.map((item) => {
        const pendingDocs = item.documents.filter((d) => d.status === 'PENDING' && d.required).length;
        return (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() =>
              router.push({ pathname: '/education/minhas-matriculas/[id]', params: { id: item.id } })
            }
          >
            <Image source={{ uri: item.photo }} style={styles.photo} />
            <View style={styles.body}>
              <Text style={styles.name}>{item.studentName}</Text>
              <Text style={styles.school}>{item.school}</Text>
              <Text style={styles.meta}>
                {item.series} · {item.shift}
              </Text>
              <StatusBadge status={item.statusCode} label={item.status} />
              {pendingDocs > 0 ? (
                <Text style={styles.pending}>
                  {pendingDocs} documento(s) pendente(s)
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
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
  photo: { width: 64, height: 64, borderRadius: 12, backgroundColor: AppColors.background.input },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  school: { fontSize: 13, color: AppColors.text.tertiary },
  meta: { fontSize: 12, color: AppColors.text.quaternary },
  pending: { fontSize: 12, fontWeight: '700', color: '#c2410c' },
  pressed: { opacity: 0.88 },
});
