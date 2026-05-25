import { AppColors } from '@/constants/theme';
import { withListImageCacheBust } from '@/components/forum/forumUtils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForumAuthorScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    userId?: string;
    name?: string;
    photoUrl?: string;
  }>();

  const displayName = (params.name ?? 'Morador(a)').trim() || 'Morador(a)';
  const initial = displayName.charAt(0).toUpperCase() || 'M';
  const photoUrl = params.photoUrl?.trim() ?? '';
  const epoch = useMemo(() => Date.now(), []);
  const photo = photoUrl ? withListImageCacheBust(photoUrl, epoch) : null;

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
      style={styles.container}
    >
      <View style={styles.profileCard}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>Participante do fórum do bairro</Text>
        {params.userId ? (
          <View style={styles.idRow}>
            <Ionicons name="finger-print-outline" size={16} color={AppColors.text.quaternary} />
            <Text style={styles.idText} numberOfLines={1}>
              {params.userId}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECEFF3' },
  scroll: { padding: 16 },
  profileCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#0891b2',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 8 },
  subtitle: { fontSize: 14, color: AppColors.text.tertiary, fontWeight: '600' },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.background.muted,
    borderRadius: 10,
    maxWidth: '100%',
  },
  idText: { fontSize: 11, color: AppColors.text.quaternary, flex: 1 },
});
