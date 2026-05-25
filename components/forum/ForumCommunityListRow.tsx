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
  onEdit?: () => void;
}

export default function ForumCommunityListRow({
  item,
  imageEpoch,
  onPress,
  onEdit,
}: ForumCommunityListRowProps) {
  const isOwner = item.myRole === 'OWNER';
  const cover = communityCoverUrl(item);
  const coverUri = cover
    ? cover.includes('?')
      ? `${cover}&v=${imageEpoch}`
      : `${cover}?v=${imageEpoch}`
    : null;
  const initial = (item.name.trim().charAt(0) || 'C').toUpperCase();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.mainPress, pressed && styles.rowPressed]}
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
      </Pressable>

      <View style={styles.trailing}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{roleLabel(item)}</Text>
        </View>
        {isOwner && onEdit ? (
          <Pressable
            onPress={onEdit}
            hitSlop={10}
            style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
            accessibilityLabel="Editar canal"
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={AppColors.text.quaternary}
            />
          </Pressable>
        ) : null}
        <Pressable onPress={onPress} hitSlop={8}>
          <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  mainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
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
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  editBtn: {
    padding: 2,
    marginRight: -2,
  },
  editBtnPressed: { opacity: 0.45 },
  badge: {
    backgroundColor: '#ecfeff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#0e7490' },
});
