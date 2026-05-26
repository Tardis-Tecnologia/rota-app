import { AppColors } from '@/constants/theme';
import { communityCoverUrl, type ForumCommunityListItem } from '@/services/forumCommunityApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface ForumCommunityCardProps {
  item: ForumCommunityListItem;
  imageEpoch: number;
  onPress: () => void;
  onFollow?: () => void | Promise<void>;
}

function roleBadge(item: ForumCommunityListItem): string | null {
  if (item.myRole === 'OWNER') return 'Dono';
  if (item.isMember) return 'Participante';
  if (item.isFollowing) return 'Seguindo';
  if (item.privacy === 'PRIVATE') return 'Privada';
  if (item.privacy === 'PUBLIC') return 'Pública';
  return null;
}

export default function ForumCommunityCard({
  item,
  imageEpoch,
  onPress,
  onFollow,
}: ForumCommunityCardProps) {
  const [following, setFollowing] = useState(false);
  const coverRaw = communityCoverUrl(item);
  const coverUri = coverRaw
    ? coverRaw.includes('?')
      ? `${coverRaw}&v=${imageEpoch}`
      : `${coverRaw}?v=${imageEpoch}`
    : null;
  const badge = roleBadge(item);
  const locationLine =
    item.locationName?.trim() ||
    item.locationAddress?.trim() ||
    (item.cep ? `CEP ${item.cep}` : null);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.coverWrap}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#0891b2', '#0e7490', '#164e63']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverPlaceholder}
          >
            <Ionicons name="people" size={40} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.75)']}
          style={styles.coverOverlay}
        />
        {onFollow ? (
          <Pressable
            style={({ pressed }) => [
              styles.followBadge,
              pressed && styles.followBadgePressed,
            ]}
            onPress={() => {
              void (async () => {
                if (following) return;
                setFollowing(true);
                try {
                  await onFollow();
                } finally {
                  setFollowing(false);
                }
              })();
            }}
            disabled={following}
            accessibilityLabel={`Seguir ${item.name}`}
            hitSlop={8}
          >
            {following ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add-circle" size={22} color="#fff" />
            )}
          </Pressable>
        ) : null}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <View style={styles.coverFooter}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {item.category ? (
            <Text style={styles.category} numberOfLines={1}>
              {item.category}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : (
          <Text style={styles.descriptionMuted}>Sem descrição</Text>
        )}
        {locationLine ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={AppColors.primaryLight} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLine}
            </Text>
          </View>
        ) : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="person-outline" size={14} color={AppColors.text.tertiary} />
            <Text style={styles.statText}>{item.membersCount} membros</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color={AppColors.text.tertiary} />
            <Text style={styles.statText}>{item.followersCount} seguidores</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: { opacity: 0.92 },
  coverWrap: { height: 140, position: 'relative', overflow: 'visible' },
  followBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0891b2',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  followBadgePressed: { opacity: 0.88 },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#0e7490' },
  coverFooter: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
  },
  name: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 22 },
  category: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  body: { padding: 14, gap: 8 },
  description: { fontSize: 14, lineHeight: 20, color: '#475569' },
  descriptionMuted: { fontSize: 14, color: AppColors.text.quaternary, fontStyle: 'italic' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { flex: 1, fontSize: 13, color: AppColors.primaryLight, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600', color: AppColors.text.tertiary },
});
