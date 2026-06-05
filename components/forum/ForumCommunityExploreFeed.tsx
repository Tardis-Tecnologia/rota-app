import ForumFeedContextChip from '@/components/forum/ForumFeedContextChip';
import ForumPostCard from '@/components/forum/ForumPostCard';
import { forumListItemToFeedPost } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanInteractAsCitizen } from '@/hooks/useIsVisitante';
import {
  createForumComment,
  likeForumPost,
  listForumComments,
  listForumPosts,
  type ForumPostCommentListItemDto,
  type ForumPostListItemDto,
  type ForumPostResponseDto,
} from '@/services/forumApi';
import {
  getCachedExploreFeed,
  getExploreFeedCacheKey,
  setCachedExploreFeed,
} from '@/services/forumCommunityCache';
import { listFollowingForumCommunities } from '@/services/forumCommunityApi';
import { shouldAppRefetch } from '@/utils/appRefreshPolicy';
import { loadPostsForChannels } from '@/utils/forumChannelPosts';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ForumCommunityExploreFeedProps {
  communityId?: string;
  communityName?: string;
  reloadToken: number;
  staleRefreshKey: number;
  onClearSelection?: () => void;
  onOpenChannelDetails?: () => void;
}

function listRowsToFeedPosts(rows: ForumPostListItemDto[]): ForumPostResponseDto[] {
  return rows.slice(0, 40).map((row) => forumListItemToFeedPost(row));
}

export default function ForumCommunityExploreFeed({
  communityId,
  communityName,
  reloadToken,
  staleRefreshKey,
  onClearSelection,
  onOpenChannelDetails,
}: ForumCommunityExploreFeedProps) {
  const isSingleChannel = !!communityId?.trim();
  const initialCacheKey = getExploreFeedCacheKey(communityId);
  const initialCache = getCachedExploreFeed(initialCacheKey);
  const { user } = useAuth();
  const canInteract = useCanInteractAsCitizen();
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPostResponseDto[]>(() => initialCache?.posts ?? []);
  const [channelNamesById, setChannelNamesById] = useState<Record<string, string>>(
    () => initialCache?.channelNamesById ?? {},
  );
  const [followingCount, setFollowingCount] = useState(() => initialCache?.followingCount ?? 0);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentsExpandedByPost, setCommentsExpandedByPost] = useState<Record<string, boolean>>(
    {},
  );
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);
  const loadRequestRef = useRef(0);

  const applyCache = useCallback((cacheKey: string) => {
    const cached = getCachedExploreFeed(cacheKey);
    if (!cached) return false;
    setPosts(cached.posts);
    setChannelNamesById(cached.channelNamesById);
    setFollowingCount(cached.followingCount);
    setLoading(false);
    return true;
  }, []);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      const cacheKey = getExploreFeedCacheKey(communityId);
      const cached = getCachedExploreFeed(cacheKey);
      const requestId = ++loadRequestRef.current;

      if (!force && cached) {
        applyCache(cacheKey);
        if (!shouldAppRefetch(cached.loadedAt, { hasData: true })) return;
      } else if (!cached) {
        setLoading(true);
      }

      setError(null);
      try {
        let rows: ForumPostListItemDto[] = [];
        const nameMap: Record<string, string> = {};
        let nextFollowingCount = 0;

        if (isSingleChannel && communityId) {
          rows = await listForumPosts(undefined, {
            communityId,
            init: 0,
            end: 30,
          });
          if (communityName) nameMap[communityId] = communityName;
        } else {
          const following = await listFollowingForumCommunities({ init: 0, end: 50 });
          nextFollowingCount = following.length;
          for (const ch of following) {
            nameMap[ch.id] = ch.name;
          }
          rows = await loadPostsForChannels(following.map((c) => c.id));
        }

        if (requestId !== loadRequestRef.current) return;

        const feedPosts = listRowsToFeedPosts(rows);
        setChannelNamesById(nameMap);
        setFollowingCount(nextFollowingCount);
        setPosts(feedPosts);
        setCommentsExpandedByPost({});
        setCommentsByPost({});
        setImageEpoch(Date.now());
        setCachedExploreFeed(cacheKey, {
          posts: feedPosts,
          channelNamesById: nameMap,
          followingCount: nextFollowingCount,
        });
      } catch (e) {
        if (requestId !== loadRequestRef.current) return;
        if (!cached) {
          setPosts([]);
          setCommentsByPost({});
          setChannelNamesById({});
        }
        setError(e instanceof Error ? e.message : 'Não foi possível carregar o feed.');
      } finally {
        if (requestId === loadRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [applyCache, communityId, communityName, isSingleChannel],
  );

  useEffect(() => {
    void load({ force: false });
  }, [communityId, load]);

  useEffect(() => {
    if (staleRefreshKey === 0) return;
    void load({ force: false });
  }, [load, staleRefreshKey]);

  useEffect(() => {
    if (reloadToken === 0) return;
    void load({ force: true });
  }, [load, reloadToken]);

  const loadCommentsForPost = useCallback(async (postId: string) => {
    try {
      const comments = await listForumComments(postId, { init: 0, end: 50 });
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os comentários.');
    }
  }, []);

  const onToggleComments = useCallback(
    (postId: string) => {
      const willExpand = !commentsExpandedByPost[postId];
      setCommentsExpandedByPost((prev) => ({ ...prev, [postId]: willExpand }));
      if (willExpand && !commentsByPost[postId]) {
        void loadCommentsForPost(postId);
      }
    },
    [commentsByPost, commentsExpandedByPost, loadCommentsForPost],
  );

  const onSendComment = useCallback(
    async (postId: string) => {
      const text = (commentDraftByPost[postId] ?? '').trim();
      if (!text || !user) return;
      setCommentSendingPostId(postId);
      try {
        await createForumComment(postId, text);
        setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          ),
        );
        const comments = await listForumComments(postId, { init: 0, end: 50 });
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível comentar.');
      } finally {
        setCommentSendingPostId(null);
      }
    },
    [commentDraftByPost, user],
  );

  const onLike = useCallback(async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const wasLiked = !!p.liked;
        return {
          ...p,
          liked: !wasLiked,
          likesCount: Math.max(0, p.likesCount + (wasLiked ? -1 : 1)),
        };
      }),
    );
    try {
      await likeForumPost(postId);
    } catch {
      void load({ force: true });
    }
  }, [load]);

  const resolveChannelLabel = (post: ForumPostResponseDto): string | undefined => {
    if (isSingleChannel) return undefined;
    const id = post.communityId ?? '';
    return id ? channelNamesById[id] : undefined;
  };

  const chipLabel = isSingleChannel
    ? communityName ?? 'Canal'
    : followingCount === 0
      ? 'Feed · siga canais no carrossel'
      : followingCount === 1
        ? 'Feed · 1 canal'
        : `Feed · ${followingCount} canais`;

  return (
    <View style={styles.wrap}>
      <ForumFeedContextChip
        label={chipLabel}
        onClear={isSingleChannel ? onClearSelection : undefined}
        onPress={isSingleChannel ? onOpenChannelDetails : undefined}
      />

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

      {!loading && !error && posts.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Ionicons name="chatbubbles-outline" size={32} color={AppColors.text.quaternary} />
          <Text style={styles.emptyTitle}>
            {isSingleChannel
              ? 'Nenhuma publicação neste canal'
              : followingCount === 0
                ? 'Nenhum canal seguido'
                : 'Sem publicações recentes'}
          </Text>
        </View>
      ) : null}

      {!loading && !error
        ? posts.map((post, index) => (
            <ForumPostCard
              key={post.id}
              showDivider={index < posts.length - 1}
              post={post}
              channelName={resolveChannelLabel(post)}
              comments={commentsByPost[post.id] ?? []}
              imageCacheEpoch={imageEpoch}
              commentDraft={commentDraftByPost[post.id] ?? ''}
              commentsExpanded={!!commentsExpandedByPost[post.id]}
              commentSending={commentSendingPostId === post.id}
              canInteract={canInteract}
              onLike={() => void onLike(post.id)}
              onToggleComments={() => onToggleComments(post.id)}
              onCommentDraftChange={(t) =>
                setCommentDraftByPost((prev) => ({ ...prev, [post.id]: t }))
              }
              onSendComment={() => void onSendComment(post.id)}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  centerBlock: { paddingVertical: 28, alignItems: 'center', gap: 6 },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600', fontSize: 13 },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  errorText: { color: AppColors.status.error, fontWeight: '700', fontSize: 13 },
  emptyBlock: {
    marginHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
});
