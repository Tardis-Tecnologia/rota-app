import { AppColors } from '@/constants/theme';
import { communityCoverUrl, type ForumCommunityListItem } from '@/services/forumCommunityApi';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

function roleLabel(item: ForumCommunityListItem): string {
  if (item.myRole === 'OWNER') return 'Dono';
  if (item.isMember) return 'Participante';
  if (item.isFollowing) return 'Seguindo';
  return item.privacy === 'PRIVATE' ? 'Privada' : 'Canal';
}

interface ForumCommunityListRowProps {
  item: ForumCommunityListItem;
  imageEpoch: number;
  onPress: () => void;
}

export default function ForumCommunityListRow({
  item,
  imageEpoch,
  onPress,
}: ForumCommunityListRowProps) {
  const cover = communityCoverUrl(item);
  const coverUri = cover
    ? cover.includes('?')
      ? `${cover}&v=${imageEpoch}`
      : `${cover}?v=${imageEpoch}`
    : null;
  const initial = (item.name.trim().charAt(0) || 'C').toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.membersCount} membros
          {item.category ? ` · ${item.category}` : ''}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{roleLabel(item)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  rowPressed: { opacity: 0.88 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '800', fontSize: 16 },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  meta: { fontSize: 12, color: AppColors.text.tertiary, marginTop: 2, fontWeight: '500' },
  badge: {
    backgroundColor: '#ecfeff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#0e7490' },
});
