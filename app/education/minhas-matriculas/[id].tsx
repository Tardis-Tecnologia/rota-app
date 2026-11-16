import RequestTimeline from '@/components/education/RequestTimeline';
import StatusBadge from '@/components/education/StatusBadge';
import { AppColors } from '@/constants/theme';
import { getEnrollmentById } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MinhaMatriculaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = getEnrollmentById(id ?? '');
  const [docs, setDocs] = useState(item?.documents ?? []);

  const timeline = useMemo(
    () =>
      (item?.history ?? []).map((h, index, arr) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        date: h.date,
        done: true,
        current: index === arr.length - 1,
      })),
    [item],
  );

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Matrícula não encontrada.</Text>
      </View>
    );
  }

  const sendDoc = (docId: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: 'SENT' as const } : d)),
    );
    Alert.alert('Documento enviado', 'Envio realizado com sucesso.');
  };

  const pendencies = docs.filter((d) => d.status === 'PENDING' && d.required);

  return (
    <>
      <Stack.Screen options={{ title: item.studentName }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: item.photo }} style={styles.hero} />
        <View style={styles.card}>
          <Text style={styles.label}>Situação da matrícula</Text>
          <StatusBadge status={item.statusCode} label={item.status} />
          <Text style={styles.name}>{item.studentName}</Text>
          <Text style={styles.row}>Nascimento: {item.birthDate}</Text>
          <Text style={styles.row}>Escola: {item.school}</Text>
          <Text style={styles.row}>
            Série: {item.series} · Turno: {item.shift}
          </Text>
          <Text style={styles.row}>Solicitado em: {item.requestedAt}</Text>
        </View>

        <Text style={styles.section}>Documentos necessários</Text>
        <View style={styles.card}>
          {docs.length === 0 ? (
            <Text style={styles.muted}>Nenhum documento listado.</Text>
          ) : (
            docs.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <View style={styles.docMain}>
                  <Text style={styles.docName}>
                    {doc.name}
                    {doc.required ? ' *' : ''}
                  </Text>
                  <StatusBadge status={doc.status} />
                </View>
                {doc.status === 'PENDING' ? (
                  <Pressable style={styles.docBtn} onPress={() => sendDoc(doc.id)}>
                    <Text style={styles.docBtnText}>Enviar</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        <Text style={styles.section}>Pendências</Text>
        <View style={styles.card}>
          {pendencies.length === 0 ? (
            <Text style={styles.muted}>Nenhuma pendência no momento.</Text>
          ) : (
            pendencies.map((d) => (
              <View key={d.id} style={styles.pendency}>
                <Ionicons name="alert-circle" size={16} color="#c2410c" />
                <Text style={styles.pendencyText}>{d.name}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.section}>Histórico</Text>
        <View style={styles.card}>
          <RequestTimeline steps={timeline} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  hero: { width: '100%', height: 160, backgroundColor: AppColors.background.input },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  label: { fontSize: 12, fontWeight: '700', color: AppColors.text.quaternary },
  name: { fontSize: 20, fontWeight: '800', color: AppColors.text.secondary },
  row: { fontSize: 14, color: AppColors.text.secondary },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  docMain: { flex: 1, gap: 4 },
  docName: { fontSize: 14, fontWeight: '600', color: AppColors.text.secondary },
  docBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  docBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  pendency: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendencyText: { color: '#c2410c', fontWeight: '600', fontSize: 13 },
  muted: { color: AppColors.text.tertiary, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
