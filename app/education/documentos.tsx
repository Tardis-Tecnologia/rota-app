import StatusBadge from '@/components/education/StatusBadge';
import { AppColors } from '@/constants/theme';
import { DECLARATION_LABEL } from '@/services/educationServicesApi';
import { mockDocumentCatalog, mockEnrichedRequests, mockStudent } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DocumentosScreen() {
  const [requests, setRequests] = useState(
    mockEnrichedRequests.filter((r) => r.kind === 'DECLARATION'),
  );

  const requestDeclaration = (kind: string, title: string) => {
    const protocol = `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setRequests((prev) => [
      {
        id: `local-${protocol}`,
        kind: 'DECLARATION',
        status: 'RECEIVED',
        studentName: mockStudent.name,
        series: mockStudent.series,
        message: title,
        note: null,
        createdAt: new Date().toISOString(),
        school: mockStudent.school,
        targetSchool: null,
        protocol,
        nextSteps: ['Aguardar análise', 'Baixar quando disponível'],
        pendencies: [],
        timeline: [],
      },
      ...prev,
    ]);
    Alert.alert('Solicitação enviada', `Protocolo ${protocol}.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Documentos disponíveis</Text>
      {mockDocumentCatalog.map((doc) => (
        <View key={doc.id} style={styles.card}>
          <Text style={styles.title}>{doc.title}</Text>
          <Text style={styles.desc}>{doc.description}</Text>
          <Pressable
            style={styles.primary}
            onPress={() => requestDeclaration(doc.kind, doc.title)}
          >
            <Text style={styles.primaryText}>Solicitar</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.section}>Declarações do aluno</Text>
      {mockStudent.declarations.map((d) => (
        <View key={d.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{DECLARATION_LABEL[d.kind] ?? d.kind}</Text>
            <StatusBadge status={d.status} />
          </View>
          {d.body ? <Text style={styles.desc}>{d.body}</Text> : null}
          {d.status === 'READY' ? (
            <Pressable
              style={styles.secondary}
              onPress={() => Alert.alert('Download', 'Download iniciado.')}
            >
              <Ionicons name="download-outline" size={16} color={AppColors.primary} />
              <Text style={styles.secondaryText}>Baixar</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <Text style={styles.section}>Solicitações</Text>
      {requests.map((req) => (
        <View key={req.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.protocol}>{req.protocol}</Text>
            <StatusBadge status={req.status} />
          </View>
          <Text style={styles.desc}>{req.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  section: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: AppColors.text.secondary },
  desc: { fontSize: 13, lineHeight: 18, color: AppColors.text.tertiary },
  protocol: { fontWeight: '800', color: AppColors.primary },
  primary: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  secondary: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryText: { color: AppColors.primary, fontWeight: '700', fontSize: 13 },
});
