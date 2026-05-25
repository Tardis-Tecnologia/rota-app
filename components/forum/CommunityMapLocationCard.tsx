import { AppColors } from '@/constants/theme';
import { communityCoverUrl, type ForumCommunityListItem } from '@/services/forumCommunityApi';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface CommunityMapLocationCardProps {
  community: Pick<
    ForumCommunityListItem,
    | 'name'
    | 'category'
    | 'locationName'
    | 'locationAddress'
    | 'coverPublicUrl'
    | 'coverMediaId'
  >;
  imageEpoch?: number;
  style?: ViewStyle;
}

export default function CommunityMapLocationCard({
  community,
  imageEpoch = 0,
  style,
}: CommunityMapLocationCardProps) {
  const cover = communityCoverUrl(community);
  const coverUri = cover
    ? cover.includes('?')
      ? `${cover}&v=${imageEpoch}`
      : `${cover}?v=${imageEpoch}`
    : null;
  const initial = (community.name.trim().charAt(0) || 'C').toUpperCase();
  const locationLine =
    community.locationName?.trim() ||
    community.locationAddress?.trim() ||
    'Local do canal no mapa';

  return (
    <View style={[styles.card, style]} pointerEvents="box-none">
      <View style={styles.handle} />
      <View style={styles.row}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {community.name}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#0891b2" />
            <Text style={styles.locationText} numberOfLines={2}>
              {locationLine}
            </Text>
          </View>
          {community.category?.trim() ? (
            <Text style={styles.category} numberOfLines={1}>
              {community.category.trim()}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.pinBadge}>
        <Ionicons name="people" size={14} color="#0e7490" />
        <Text style={styles.pinBadgeText}>Ponto do canal da comunidade</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(8,145,178,0.15)',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.border.muted,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: AppColors.background.muted,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  body: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
    fontWeight: '500',
  },
  category: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#0e7490',
  },
  pinBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  pinBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0e7490',
  },
});
