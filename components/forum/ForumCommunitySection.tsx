import CommunitySegmentTabs from '@/components/forum/CommunitySegmentTabs';
import ForumChannelActionMenu from '@/components/forum/ForumChannelActionMenu';
import ForumCommunityChannelsCarousel from '@/components/forum/ForumCommunityChannelsCarousel';
import ForumCommunityExploreFeed from '@/components/forum/ForumCommunityExploreFeed';
import ForumCommunityListRow from '@/components/forum/ForumCommunityListRow';
import { AppColors } from '@/constants/theme';
import {
  followForumCommunity,
  listFollowingForumCommunities,
  listForumCommunities,
  listMyForumCommunities,
  listMyRelatedForumCommunities,
  type ForumCommunityListItem,
} from '@/services/forumCommunityApi';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COMMUNITY_SEGMENTS = [
  { key: 'explore', label: 'Explorar' },
  { key: 'mine', label: 'Minhas' },
];

function canShowFollowBadge(ch: ForumCommunityListItem): boolean {
  return (
    ch.privacy === 'PUBLIC' &&
    !ch.isMember &&
    !ch.isFollowing &&
    ch.myRole !== 'OWNER'
  );
}

function buildCarouselChannels(
  mine: ForumCommunityListItem[],
  following: ForumCommunityListItem[],
  explore: ForumCommunityListItem[],
): ForumCommunityListItem[] {
  const map = new Map<string, ForumCommunityListItem>();
  for (const item of [...mine, ...following]) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  const result = Array.from(map.values());
  for (const item of explore) {
    if (map.has(item.id)) continue;
    if (canShowFollowBadge(item)) {
      result.push(item);
      map.set(item.id, item);
    }
  }
  return result;
}

function findChannelInLists(
  id: string,
  ...lists: ForumCommunityListItem[][]
): ForumCommunityListItem | null {
  for (const list of lists) {
    const found = list.find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}

interface ForumCommunitySectionProps {
  refreshing: boolean;
  onRefresh: () => void;
  onRefreshComplete?: () => void;
}

export default function ForumCommunitySection({
  refreshing,
  onRefresh,
  onRefreshComplete,
}: ForumCommunitySectionProps) {
  const [activeTab, setActiveTab] = useState('explore');
  const [loading, setLoading] = useState(true);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ForumCommunityListItem[]>([]);
  const [carouselChannels, setCarouselChannels] = useState<ForumCommunityListItem[]>([]);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const [selectedChannel, setSelectedChannel] = useState<ForumCommunityListItem | null>(null);
  const [menuChannel, setMenuChannel] = useState<ForumCommunityListItem | null>(null);
  const [feedReloadToken, setFeedReloadToken] = useState(0);

  const isExploreTab = activeTab === 'explore';

  const loadCarousel = useCallback(async () => {
    setCarouselLoading(true);
    try {
      const [mine, following, explore] = await Promise.all([
        listMyForumCommunities({ init: 0, end: 40 }),
        listFollowingForumCommunities({ init: 0, end: 40 }),
        listForumCommunities(undefined, { init: 0, end: 40 }),
      ]);
      setCarouselChannels(buildCarouselChannels(mine, following, explore));
      setSelectedChannel((prev) => {
        if (!prev) return null;
        return findChannelInLists(prev.id, mine, following, explore) ?? prev;
      });
    } catch {
      setCarouselChannels([]);
    } finally {
      setCarouselLoading(false);
    }
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isExploreTab) {
        if (isRefresh) setFeedReloadToken((t) => t + 1);
        setLoading(false);
        setError(null);
        return;
      }
      if (!isRefresh) setLoading(true);
      setError(null);
      try {
        const rows = await listMyRelatedForumCommunities({ init: 0, end: 50 });
        setItems(rows);
        setImageEpoch(Date.now());
        await loadCarousel();
      } catch (e) {
        setItems([]);
        setError(e instanceof Error ? e.message : 'Não foi possível carregar comunidades.');
      } finally {
        setLoading(false);
      }
    },
    [isExploreTab, loadCarousel],
  );

  useFocusEffect(
    useCallback(() => {
      void loadCarousel();
      void load(false);
    }, [load, loadCarousel]),
  );

  const handleRefresh = useCallback(async () => {
    onRefresh();
    try {
      await loadCarousel();
      await load(true);
    } finally {
      onRefreshComplete?.();
    }
  }, [load, loadCarousel, onRefresh, onRefreshComplete]);

  const openChannelDetails = useCallback((id: string) => {
    router.push({ pathname: '/forum/communities/[id]', params: { id } });
  }, []);

  const handleFollowChannel = useCallback(
    async (id: string) => {
      await followForumCommunity(id);
      await loadCarousel();
      setFeedReloadToken((t) => t + 1);
      if (menuChannel?.id === id) {
        setMenuChannel((prev) =>
          prev ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 } : null,
        );
      }
      if (selectedChannel?.id === id) {
        setSelectedChannel((prev) =>
          prev ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 } : null,
        );
      }
    },
    [loadCarousel, menuChannel?.id, selectedChannel?.id],
  );

  const selectChannel = useCallback((channel: ForumCommunityListItem) => {
    setSelectedChannel(channel);
    setActiveTab('explore');
    setFeedReloadToken((t) => t + 1);
    setMenuChannel(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedChannel(null);
    setFeedReloadToken((t) => t + 1);
  }, []);

  const onTabSelect = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      if (tab === 'explore') {
        setFeedReloadToken((t) => t + 1);
        setError(null);
      } else {
        setError(null);
        void load(false);
      }
    },
    [load],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.stickyHeader}>
        <ForumCommunityChannelsCarousel
          channels={carouselChannels}
          imageEpoch={imageEpoch}
          loading={carouselLoading}
          selectedChannelId={selectedChannel?.id ?? null}
          onChannelPress={setMenuChannel}
          onCreatePress={() => router.push('/forum/communities/create')}
          onFollowChannel={handleFollowChannel}
        />
        <CommunitySegmentTabs
          options={COMMUNITY_SEGMENTS}
          active={activeTab}
          onSelect={onTabSelect}
        />
      </View>

      <ForumChannelActionMenu
        channel={menuChannel}
        isSelected={menuChannel?.id === selectedChannel?.id}
        canFollow={menuChannel ? canShowFollowBadge(menuChannel) : false}
        onClose={() => setMenuChannel(null)}
        onViewDetails={() => {
          if (!menuChannel) return;
          const id = menuChannel.id;
          setMenuChannel(null);
          openChannelDetails(id);
        }}
        onFollow={
          menuChannel && canShowFollowBadge(menuChannel)
            ? () => {
                const id = menuChannel.id;
                setMenuChannel(null);
                void handleFollowChannel(id);
              }
            : undefined
        }
        onSelect={() => {
          if (!menuChannel) return;
          selectChannel(menuChannel);
        }}
        onDeselect={() => {
          setMenuChannel(null);
          clearSelection();
        }}
      />

      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      >
        {isExploreTab ? (
          <ForumCommunityExploreFeed
            communityId={selectedChannel?.id}
            communityName={selectedChannel?.name}
            reloadToken={feedReloadToken}
            onClearSelection={selectedChannel ? clearSelection : undefined}
            onOpenChannelDetails={
              selectedChannel ? () => openChannelDetails(selectedChannel.id) : undefined
            }
          />
        ) : null}

        {!isExploreTab && loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.centerText}>Carregando...</Text>
          </View>
        ) : null}

        {!isExploreTab && error && !loading ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!isExploreTab && !loading && !error && items.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ionicons name="people-outline" size={40} color={AppColors.text.quaternary} />
            <Text style={styles.emptyTitle}>Nenhum canal ainda</Text>
            <Text style={styles.emptyHint}>
              Crie um canal, participe de um ou siga comunidades no carrossel em Explorar.
            </Text>
          </View>
        ) : null}

        {!isExploreTab && !loading && !error
          ? items.map((item) => (
              <ForumCommunityListRow
                key={item.id}
                item={item}
                imageEpoch={imageEpoch}
                onPress={() => openChannelDetails(item.id)}
              />
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  stickyHeader: {
    backgroundColor: '#ECEFF3',
    paddingBottom: 8,
    zIndex: 2,
  },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: 24 },
  centerBlock: { paddingVertical: 32, alignItems: 'center', gap: 6 },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600', fontSize: 13 },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  errorText: { color: AppColors.status.error, fontWeight: '700', fontSize: 13 },
  emptyBlock: {
    marginHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
