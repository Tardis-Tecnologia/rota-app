import StatusBadge from '@/components/education/StatusBadge';
import { AppColors } from '@/constants/theme';
import { mockEnrichedRequests } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const KIND_LABEL: Record<string, string> = {
  ENROLLMENT: 'Matrícula',
  TRANSFER: 'Transferência',
  DAYCARE: 'Creche',
  DECLARATION: 'Declaração',
  OMBUDSMAN: 'Ouvidoria',
  TRANSPORT: 'Transporte',
};

export default function SolicitacoesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {mockEnrichedRequests.map((req) => (
        <Pressable
          key={req.id}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/education/solicitacoes/[id]', params: { id: req.id } })
          }
        >
          <View style={styles.top}>
            <Text style={styles.protocol}>{req.protocol}</Text>
            <StatusBadge status={req.status} />
          </View>
          <Text style={styles.kind}>{KIND_LABEL[req.kind] ?? req.kind}</Text>
          <Text style={styles.student}>{req.studentName}</Text>
          <Text style={styles.school}>{req.school?.name ?? 'Sem escola vinculada'}</Text>
          <View style={styles.footer}>
            <Text style={styles.date}>
              {new Date(req.createdAt).toLocaleDateString('pt-BR')}
            </Text>
            <View style={styles.link}>
              <Text style={styles.linkText}>Acompanhar</Text>
              <Ionicons name="chevron-forward" size={14} color={AppColors.primary} />
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  protocol: { fontSize: 13, fontWeight: '800', color: AppColors.primary },
  kind: { marginTop: 8, fontSize: 12, fontWeight: '700', color: AppColors.text.quaternary },
  student: { marginTop: 2, fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  school: { marginTop: 2, fontSize: 13, color: AppColors.text.tertiary },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 12, color: AppColors.text.quaternary },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontSize: 13, fontWeight: '700', color: AppColors.primary },
  pressed: { opacity: 0.88 },
});
