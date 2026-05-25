import { AppColors } from '@/constants/theme';
import {
  communityCoverUrl,
  type ForumCommunityListItem,
} from '@/services/forumCommunityApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const BUBBLE_SIZE = 56;
const LABEL_WIDTH = 64;

interface ForumCommunityChannelsCarouselProps {
  channels: ForumCommunityListItem[];
  imageEpoch: number;
  loading?: boolean;
  selectedChannelId: string | null;
  onChannelPress: (channel: ForumCommunityListItem) => void;
  onCreatePress: () => void;
  onFollowChannel: (id: string) => Promise<void>;
}

function channelInitial(name: string): string {
  return (name.trim().charAt(0) || 'C').toUpperCase();
}

function canShowFollowBadge(ch: ForumCommunityListItem): boolean {
  return (
    ch.privacy === 'PUBLIC' &&
    !ch.isMember &&
    !ch.isFollowing &&
    ch.myRole !== 'OWNER'
  );
}

function CommunityChannelItem({
  ch,
  imageEpoch,
  isSelected,
  onChannelPress,
  onFollowChannel,
}: {
  ch: ForumCommunityListItem;
  imageEpoch: number;
  isSelected: boolean;
  onChannelPress: (channel: ForumCommunityListItem) => void;
  onFollowChannel: (id: string) => Promise<void>;
}) {
  const [following, setFollowing] = useState(false);
  const showFollow = canShowFollowBadge(ch);
  const cover = communityCoverUrl(ch);
  const coverUri = cover
    ? cover.includes('?')
      ? `${cover}&v=${imageEpoch}`
      : `${cover}?v=${imageEpoch}`
    : null;

  const ring = isSelected
    ? '#0891b2'
    : ch.myRole === 'OWNER'
      ? '#0e7490'
      : ch.isMember
        ? '#14b8a6'
        : ch.isFollowing
          ? '#94a3b8'
          : undefined;

  const onFollowPress = async () => {
    if (following) return;
    setFollowing(true);
    try {
      await onFollowChannel(ch.id);
    } finally {
      setFollowing(false);
    }
  };

  return (
    <View style={styles.item}>
      <Pressable
        onPress={() => onChannelPress(ch)}
        style={({ pressed }) => [pressed && styles.itemPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Opções do canal ${ch.name}`}
      >
        <View
          style={[
            styles.bubbleOuter,
            ring ? { borderColor: ring, borderWidth: isSelected ? 3 : 2.5 } : null,
            isSelected && styles.bubbleSelected,
          ]}
        >
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
          ) : (
            <View style={styles.initialBubble}>
              <Text style={styles.initialText}>{channelInitial(ch.name)}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {isSelected ? (
        <View style={styles.selectedDot} pointerEvents="none">
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
      ) : null}

      {showFollow ? (
        <Pressable
          style={({ pressed }) => [
            styles.followBadge,
            pressed && styles.followBadgePressed,
          ]}
          onPress={() => void onFollowPress()}
          disabled={following}
          accessibilityRole="button"
          accessibilityLabel={`Seguir comunidade ${ch.name}`}
          hitSlop={6}
        >
          {following ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add-circle" size={18} color="#fff" />
          )}
        </Pressable>
      ) : null}

      <Text style={styles.label} numberOfLines={2}>
        {ch.name}
      </Text>
    </View>
  );
}

export default function ForumCommunityChannelsCarousel({
  channels,
  imageEpoch,
  loading,
  selectedChannelId,
  onChannelPress,
  onCreatePress,
  onFollowChannel,
}: ForumCommunityChannelsCarouselProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          onPress={onCreatePress}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          accessibilityRole="button"
          accessibilityLabel="Criar nova comunidade"
        >
          <View style={styles.createBubbleWrap}>
            <View style={styles.createBubble}>
              <Ionicons name="people" size={22} color="#64748b" />
            </View>
            <View style={styles.createPlusBadge}>
              <Ionicons name="add-circle" size={20} color="#0891b2" />
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>
            Criar
          </Text>
        </Pressable>

        {loading ? (
          <View style={styles.item}>
            <View style={[styles.bubbleOuter, styles.skeletonBubble]} />
            <Text style={styles.labelMuted}>...</Text>
          </View>
        ) : null}

        {!loading
          ? channels.map((ch) => (
              <CommunityChannelItem
                key={ch.id}
                ch={ch}
                imageEpoch={imageEpoch}
                isSelected={selectedChannelId === ch.id}
                onChannelPress={onChannelPress}
                onFollowChannel={onFollowChannel}
              />
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: AppColors.background.default,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border.muted,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 4,
    alignItems: 'flex-start',
  },
  item: {
    width: LABEL_WIDTH,
    alignItems: 'center',
    marginHorizontal: 4,
    position: 'relative',
  },
  itemPressed: { opacity: 0.85 },
  bubbleOuter: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: AppColors.background.muted,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  bubbleSelected: {
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedDot: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0891b2',
    borderWidth: 2,
    borderColor: AppColors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  createBubbleWrap: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    position: 'relative',
  },
  createBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: AppColors.background.default,
    borderRadius: 14,
  },
  followBadge: {
    position: 'absolute',
    top: BUBBLE_SIZE - 20,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0891b2',
    borderWidth: 2,
    borderColor: AppColors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  followBadgePressed: { opacity: 0.85 },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  initialBubble: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#64748b',
  },
  initialText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  skeletonBubble: {
    backgroundColor: '#e2e8f0',
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
    width: LABEL_WIDTH,
  },
  labelMuted: {
    marginTop: 8,
    fontSize: 11,
    color: AppColors.text.quaternary,
    textAlign: 'center',
  },
});
