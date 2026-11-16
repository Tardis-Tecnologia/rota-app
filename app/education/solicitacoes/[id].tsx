import RequestTimeline from '@/components/education/RequestTimeline';
import StatusBadge from '@/components/education/StatusBadge';
import { AppColors } from '@/constants/theme';
import { getEnrichedRequestById } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SolicitacaoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const req = getEnrichedRequestById(id ?? '');

  if (!req) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Solicitação não encontrada.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: req.protocol }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <StatusBadge status={req.status} />
          <Text style={styles.student}>{req.studentName}</Text>
          <Text style={styles.meta}>
            {req.series ? `${req.series} · ` : ''}
            {req.school?.name ?? 'Sem escola'}
          </Text>
          {req.targetSchool ? (
            <Text style={styles.meta}>Destino: {req.targetSchool.name}</Text>
          ) : null}
          <Text style={styles.message}>{req.message}</Text>
        </View>

        <Text style={styles.section}>Linha do tempo</Text>
        <View style={styles.card}>
          <RequestTimeline steps={req.timeline} />
        </View>

        <Text style={styles.section}>Pendências</Text>
        <View style={styles.card}>
          {req.pendencies.length === 0 ? (
            <Text style={styles.muted}>Nenhuma pendência.</Text>
          ) : (
            req.pendencies.map((p) => (
              <View key={p} style={styles.bullet}>
                <Ionicons name="alert-circle" size={16} color="#c2410c" />
                <Text style={styles.pendency}>{p}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.section}>Próximos passos</Text>
        <View style={styles.card}>
          {req.nextSteps.map((step) => (
            <View key={step} style={styles.bullet}>
              <Ionicons name="arrow-forward-circle" size={16} color={AppColors.primary} />
              <Text style={styles.next}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
    marginBottom: 8,
  },
  student: { fontSize: 18, fontWeight: '800', color: AppColors.text.secondary },
  meta: { fontSize: 13, color: AppColors.text.tertiary },
  message: { fontSize: 14, color: AppColors.text.secondary, lineHeight: 20 },
  section: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
  },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pendency: { flex: 1, color: '#c2410c', fontWeight: '600', fontSize: 13 },
  next: { flex: 1, color: AppColors.text.secondary, fontSize: 13, lineHeight: 18 },
  muted: { color: AppColors.text.tertiary, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
