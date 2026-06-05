import CommunitySegmentTabs from '@/components/forum/CommunitySegmentTabs';
import ForumChannelActionMenu from '@/components/forum/ForumChannelActionMenu';
import ForumCommunityChannelsCarousel from '@/components/forum/ForumCommunityChannelsCarousel';
import ForumCommunityExploreFeed from '@/components/forum/ForumCommunityExploreFeed';
import ForumCommunityListRow from '@/components/forum/ForumCommunityListRow';
import { AppColors } from '@/constants/theme';
import { useCanInteractAsCitizen, useIsVisitante } from '@/hooks/useIsVisitante';
import { confirmAndSubmitForumReport } from '@/utils/forumReportFlow';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import {
  followForumCommunity,
  listFollowingForumCommunities,
  listForumCommunities,
  listMyForumCommunities,
  listMyRelatedForumCommunities,
  type ForumCommunityListItem,
} from '@/services/forumCommunityApi';
import {
  getCachedCarouselChannels,
  getCachedMineList,
  getExploreFeedCacheKey,
  invalidateExploreFeedCache,
  setCachedCarouselChannels,
  setCachedMineList,
} from '@/services/forumCommunityCache';
import { shouldAppRefetch } from '@/utils/appRefreshPolicy';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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
  return !ch.isMember && !ch.isFollowing && ch.myRole !== 'OWNER';
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
  const isVisitante = useIsVisitante();
  const canInteract = useCanInteractAsCitizen();
  const [activeTab, setActiveTab] = useState('explore');
  const [loading, setLoading] = useState(() => !getCachedMineList()?.items.length);
  const [carouselLoading, setCarouselLoading] = useState(
    () => !getCachedCarouselChannels()?.channels.length,
  );
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ForumCommunityListItem[]>(
    () => getCachedMineList()?.items ?? [],
  );
  const [carouselChannels, setCarouselChannels] = useState<ForumCommunityListItem[]>(
    () => getCachedCarouselChannels()?.channels ?? [],
  );
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const [selectedChannel, setSelectedChannel] = useState<ForumCommunityListItem | null>(null);
  const [menuChannel, setMenuChannel] = useState<ForumCommunityListItem | null>(null);
  const [feedReloadToken, setFeedReloadToken] = useState(0);
  const [staleRefreshKey, setStaleRefreshKey] = useState(0);
  const carouselLoadedAtRef = useRef(getCachedCarouselChannels()?.loadedAt ?? 0);
  const mineLoadedAtRef = useRef(getCachedMineList()?.loadedAt ?? 0);

  const isExploreTab = activeTab === 'explore';

  const loadCarousel = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const cached = getCachedCarouselChannels();

    if (!force && cached && carouselChannels.length > 0) {
      if (!shouldAppRefetch(carouselLoadedAtRef.current, { hasData: true })) return;
    } else if (!force && cached && carouselChannels.length === 0) {
      setCarouselChannels(cached.channels);
      carouselLoadedAtRef.current = cached.loadedAt;
      setCarouselLoading(false);
      if (!shouldAppRefetch(cached.loadedAt, { hasData: true })) return;
    }

    setCarouselLoading(carouselChannels.length === 0);
    try {
      const [mine, following, explore] = await Promise.all([
        listMyForumCommunities({ init: 0, end: 40 }),
        listFollowingForumCommunities({ init: 0, end: 40 }),
        listForumCommunities(undefined, { init: 0, end: 40 }),
      ]);
      const channels = buildCarouselChannels(mine, following, explore);
      setCarouselChannels(channels);
      carouselLoadedAtRef.current = Date.now();
      setCachedCarouselChannels(channels);
      setSelectedChannel((prev) => {
        if (!prev) return null;
        return findChannelInLists(prev.id, mine, following, explore) ?? prev;
      });
    } catch {
      if (carouselChannels.length === 0) setCarouselChannels([]);
    } finally {
      setCarouselLoading(false);
    }
  }, [carouselChannels.length]);

  const loadMine = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const cached = getCachedMineList();

    if (!force && cached && items.length > 0) {
      if (!shouldAppRefetch(mineLoadedAtRef.current, { hasData: true })) return;
    } else if (!force && cached && items.length === 0) {
      setItems(cached.items);
      mineLoadedAtRef.current = cached.loadedAt;
      setLoading(false);
      if (!shouldAppRefetch(cached.loadedAt, { hasData: true })) return;
    }

    if (!force && items.length === 0) setLoading(true);
    setError(null);
    try {
      const rows = await listMyRelatedForumCommunities({ init: 0, end: 50 });
      setItems(rows);
      setImageEpoch(Date.now());
      mineLoadedAtRef.current = Date.now();
      setCachedMineList(rows);
    } catch (e) {
      if (items.length === 0) {
        setItems([]);
        setError(e instanceof Error ? e.message : 'Não foi possível carregar comunidades.');
      }
    } finally {
      setLoading(false);
    }
  }, [items.length]);

  useFocusEffect(
    useCallback(() => {
      void loadCarousel({ force: false });
      void loadMine({ force: false });
      setStaleRefreshKey((k) => k + 1);
    }, [loadCarousel, loadMine]),
  );

  const handleRefresh = useCallback(async () => {
    onRefresh();
    try {
      await loadCarousel({ force: true });
      await loadMine({ force: true });
      setFeedReloadToken((t) => t + 1);
    } finally {
      onRefreshComplete?.();
    }
  }, [loadCarousel, loadMine, onRefresh, onRefreshComplete]);

  const openChannelDetails = useCallback((id: string) => {
    router.push({ pathname: '/forum/communities/[id]', params: { id } });
  }, []);

  const handleFollowChannel = useCallback(
    async (id: string) => {
      if (isVisitante) {
        promptVisitanteLogin('seguir canais da comunidade');
        return;
      }
      await followForumCommunity(id);
      invalidateExploreFeedCache(getExploreFeedCacheKey());
      await loadCarousel({ force: true });
      if (!selectedChannel?.id) {
        setFeedReloadToken((t) => t + 1);
      }
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
    [isVisitante, loadCarousel, menuChannel?.id, selectedChannel?.id],
  );

  const selectChannel = useCallback((channel: ForumCommunityListItem) => {
    setSelectedChannel(channel);
    setActiveTab('explore');
    setMenuChannel(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedChannel(null);
  }, []);

  const onTabSelect = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      setError(null);
      if (tab === 'mine') {
        void loadMine({ force: false });
      }
    },
    [loadMine],
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
          onCreatePress={() => {
            if (isVisitante) {
              promptVisitanteLogin('criar comunidades');
              return;
            }
            router.push('/forum/communities/create');
          }}
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
        canReport={menuChannel ? menuChannel.myRole !== 'OWNER' : false}
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
        onReport={
          menuChannel && menuChannel.myRole !== 'OWNER'
            ? () => {
                const id = menuChannel.id;
                setMenuChannel(null);
                confirmAndSubmitForumReport('FORUM_COMMUNITY', id, { canInteract });
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
        <View style={[styles.tabPanel, !isExploreTab && styles.tabPanelHidden]}>
          <ForumCommunityExploreFeed
            communityId={selectedChannel?.id}
            communityName={selectedChannel?.name}
            reloadToken={feedReloadToken}
            staleRefreshKey={staleRefreshKey}
            onClearSelection={selectedChannel ? clearSelection : undefined}
            onOpenChannelDetails={
              selectedChannel ? () => openChannelDetails(selectedChannel.id) : undefined
            }
          />
        </View>

        <View style={[styles.tabPanel, isExploreTab && styles.tabPanelHidden]}>
          {loading ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.centerText}>Carregando...</Text>
            </View>
          ) : null}

          {error && !loading ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error && items.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="people-outline" size={40} color={AppColors.text.quaternary} />
              <Text style={styles.emptyTitle}>Nenhum canal ainda</Text>
              <Text style={styles.emptyHint}>
                Crie um canal, participe de um ou siga comunidades no carrossel em Explorar.
              </Text>
            </View>
          ) : null}

          {!loading && !error
            ? items.map((item) => (
                <ForumCommunityListRow
                  key={item.id}
                  item={item}
                  imageEpoch={imageEpoch}
                  onPress={() => openChannelDetails(item.id)}
                  onEdit={
                    item.myRole === 'OWNER'
                      ? () =>
                          router.push({
                            pathname: '/forum/communities/edit',
                            params: { id: item.id },
                          })
                      : undefined
                  }
                />
              ))
            : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  stickyHeader: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    zIndex: 2,
  },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: 24 },
  tabPanel: {},
  tabPanelHidden: { display: 'none' },
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
