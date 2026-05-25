import ForumFeedContextChip from '@/components/forum/ForumFeedContextChip';
import ForumPostCard from '@/components/forum/ForumPostCard';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  createForumComment,
  getForumPost,
  likeForumPost,
  listForumComments,
  listForumPosts,
  type ForumPostCommentListItemDto,
  type ForumPostResponseDto,
} from '@/services/forumApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ForumAllPostsSectionProps {
  refreshing: boolean;
  onRefresh: () => void;
  onRefreshComplete: () => void;
  reloadToken: number;
}

export default function ForumAllPostsSection({
  refreshing,
  onRefresh,
  onRefreshComplete,
  reloadToken,
}: ForumAllPostsSectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPostResponseDto[]>([]);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentsExpandedByPost, setCommentsExpandedByPost] = useState<Record<string, boolean>>(
    {},
  );
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = (await listForumPosts(undefined, { init: 0, end: 60 })).filter(
        (r) => !r.communityId?.trim(),
      );
      const top = rows.slice(0, 30);
      const detailed = (await Promise.all(top.map((r) => getForumPost(r.id)))).filter(
        (p) => !p.communityId?.trim(),
      );
      const commentEntries = await Promise.all(
        detailed.map(async (p) => {
          const comments = await listForumComments(p.id, { init: 0, end: 50 });
          return [p.id, comments] as const;
        }),
      );
      setCommentsByPost(Object.fromEntries(commentEntries));
      setPosts(detailed);
      setCommentsExpandedByPost({});
      setImageEpoch(Date.now());
    } catch (e) {
      setPosts([]);
      setCommentsByPost({});
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  const handleRefresh = useCallback(async () => {
    onRefresh();
    try {
      await load();
    } finally {
      onRefreshComplete();
    }
  }, [load, onRefresh, onRefreshComplete]);

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

  const onLike = useCallback(
    async (postId: string) => {
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
        void load();
      }
    },
    [load],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.stickyHeader}>
        <ForumFeedContextChip label="Feed · publicações gerais" />
      </View>

      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      >
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
            <Text style={styles.emptyTitle}>Nenhuma publicação ainda</Text>
            <Text style={styles.emptyHint}>
              Publicações de canais aparecem na aba Comunidade.
            </Text>
          </View>
        ) : null}

        {!loading && !error
          ? posts.map((post) => (
              <ForumPostCard
                key={post.id}
                post={post}
                comments={commentsByPost[post.id] ?? []}
                imageCacheEpoch={imageEpoch}
                commentDraft={commentDraftByPost[post.id] ?? ''}
                commentsExpanded={!!commentsExpandedByPost[post.id]}
                commentSending={commentSendingPostId === post.id}
                canInteract={!!user}
                onLike={() => void onLike(post.id)}
                onToggleComments={() =>
                  setCommentsExpandedByPost((prev) => ({
                    ...prev,
                    [post.id]: !prev[post.id],
                  }))
                }
                onCommentDraftChange={(t) =>
                  setCommentDraftByPost((prev) => ({ ...prev, [post.id]: t }))
                }
                onSendComment={() => void onSendComment(post.id)}
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
    paddingTop: 4,
    paddingBottom: 0,
    zIndex: 2,
  },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: 100 },
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
  emptyHint: {
    fontSize: 13,
    color: AppColors.text.quaternary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
