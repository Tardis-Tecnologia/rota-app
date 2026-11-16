import { AppColors } from '@/constants/theme';
import { NOTICE_LABEL } from '@/services/educationServicesApi';
import { getNoticeById } from '@/services/educationMocks';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ComunicadoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = getNoticeById(id ?? '');

  if (!notice) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Comunicado não encontrado.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Comunicado' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.kind}>{NOTICE_LABEL[notice.kind] ?? notice.kind}</Text>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.meta}>{notice.schoolName}</Text>
          <Text style={styles.meta}>
            {new Date(notice.date + 'T12:00:00').toLocaleDateString('pt-BR')}
          </Text>
          <Text style={styles.body}>{notice.body}</Text>
          <Text style={styles.read}>
            {notice.read ? 'Marcado como lido' : 'Não lido'}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  kind: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  title: { marginTop: 8, fontSize: 20, fontWeight: '800', color: AppColors.text.secondary },
  meta: { marginTop: 6, fontSize: 13, color: AppColors.text.tertiary },
  body: { marginTop: 16, fontSize: 15, lineHeight: 22, color: AppColors.text.secondary },
  read: { marginTop: 16, fontSize: 12, color: AppColors.text.quaternary, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: AppColors.text.tertiary },
});
