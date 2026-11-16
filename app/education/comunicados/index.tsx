import { AppColors } from '@/constants/theme';
import { NOTICE_LABEL } from '@/services/educationServicesApi';
import { mockNotices } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ComunicadosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {mockNotices.map((notice) => (
        <Pressable
          key={notice.id}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/education/comunicados/[id]', params: { id: notice.id } })
          }
        >
          <View style={styles.top}>
            <Text style={styles.kind}>{NOTICE_LABEL[notice.kind] ?? notice.kind}</Text>
            {!notice.read ? <View style={styles.unread} /> : null}
          </View>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.school}>{notice.schoolName}</Text>
          <View style={styles.footer}>
            <Text style={styles.date}>
              {new Date(notice.date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={AppColors.text.quaternary} />
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
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { fontSize: 11, fontWeight: '700', color: AppColors.primary },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  title: { marginTop: 6, fontSize: 15, fontWeight: '700', color: AppColors.text.secondary },
  school: { marginTop: 2, fontSize: 13, color: AppColors.text.tertiary },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 12, color: AppColors.text.quaternary },
  pressed: { opacity: 0.88 },
});
