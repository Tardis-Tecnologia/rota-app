import FeedCommentsSheet from '@/components/feed/FeedCommentsSheet';
import FeedLikesSheet, { type FeedLiker } from '@/components/feed/FeedLikesSheet';
import ForumPostCard from '@/components/forum/ForumPostCard';
import {
    forumListItemToFeedPost,
    isExcludedFromGeneralForumFeed,
    openForumCommercialStoreProfile,
} from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useForumModeration } from '@/contexts/ForumModerationContext';
import { useCanInteractAsCitizen } from '@/hooks/useIsVisitante';
import {
    createForumComment,
    getForumPost,
    likeForumPost,
    listForumComments,
    listForumLikes,
    listForumPosts,
    type ForumPostCommentListItemDto,
    type ForumPostListItemDto,
    type ForumPostResponseDto,
} from '@/services/forumApi';
import { FORUM_PARTNER_STORE_POST_TYPE } from '@/types/forumCommercial';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  /** Incrementar para voltar ao topo (toque de novo na aba). */
  scrollToTopToken?: number;
  /** Mesmos posts oficiais do Feed, filtrados para o Início. */
  officialOnly?: boolean;
  /** Renderiza dentro do scroll da tela, sem um segundo ScrollView. */
  embedded?: boolean;
}

export default function ForumAllPostsSection({
  refreshing,
  onRefresh,
  onRefreshComplete,
  reloadToken,
  scrollToTopToken = 0,
  officialOnly = false,
  embedded = false,
}: ForumAllPostsSectionProps) {
  const canInteract = useCanInteractAsCitizen();
  const { isLoading: authLoading } = useAuth();
  const { handleForumApiError, requestForumComment } = useForumModeration();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPostResponseDto[]>([]);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentsSheetPostId, setCommentsSheetPostId] = useState<string | null>(null);
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState<string | null>(null);
  const [likesSheetPostId, setLikesSheetPostId] = useState<string | null>(null);
  const [likesByPost, setLikesByPost] = useState<Record<string, FeedLiker[]>>({});
  const [likesLoadingPostId, setLikesLoadingPostId] = useState<string | null>(null);
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);
  const completeRefreshAfterLoadRef = useRef(false);
  const listRef = useRef<ScrollView>(null);
  const onRefreshCompleteRef = useRef(onRefreshComplete);
  onRefreshCompleteRef.current = onRefreshComplete;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [generalRows, storeRows] = officialOnly
        ? [await listForumPosts(undefined, { official: true, init: 0, end: 20 }), []]
        : await Promise.all([
        listForumPosts(undefined, { init: 0, end: 80 }),
        listForumPosts(undefined, {
          postType: FORUM_PARTNER_STORE_POST_TYPE,
          init: 0,
          end: 40,
        }).catch(() => [] as ForumPostListItemDto[]),
      ]);
      const byId = new Map<string, (typeof generalRows)[number]>();
      for (const row of [...generalRows, ...storeRows]) {
        if (officialOnly && !row.official) continue;
        if (!row.official && isExcludedFromGeneralForumFeed(row)) continue;
        byId.set(row.id, row);
      }
      const rows = [...byId.values()].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const top = rows.slice(0, 80);
      const detailed = (
        await Promise.all(
          top.map(async (row) => {
            try {
              return await getForumPost(row.id);
            } catch {
              return forumListItemToFeedPost(row);
            }
          }),
        )
      ).filter((p) =>
        officialOnly ? p.official : p.official || !isExcludedFromGeneralForumFeed(p),
      );
      const commentEntries = await Promise.all(
        detailed.map(async (p) => {
          const comments = await listForumComments(p.id, { init: 0, end: 50 });
          return [p.id, comments] as const;
        }),
      );
      setCommentsByPost(Object.fromEntries(commentEntries));
      setPosts(detailed);
      setImageEpoch(Date.now());
    } catch (e) {
      setPosts([]);
      setCommentsByPost({});
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o feed.');
    } finally {
      setLoading(false);
    }
  }, [officialOnly]);

  useEffect(() => {
    if (embedded && refreshing) {
      completeRefreshAfterLoadRef.current = true;
    }
  }, [embedded, refreshing, reloadToken]);

  useEffect(() => {
    if (authLoading) return;
    void (async () => {
      await load();
      if (completeRefreshAfterLoadRef.current) {
        completeRefreshAfterLoadRef.current = false;
        onRefreshCompleteRef.current();
      }
    })();
  }, [authLoading, load, reloadToken]);

  useEffect(() => {
    if (scrollToTopToken < 1) return;
    listRef.current?.scrollTo({ y: 0, animated: true });
  }, [scrollToTopToken]);

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
        if (await handleForumApiError(e)) return;
        setError(e instanceof Error ? e.message : 'Não foi possível comentar.');
      } finally {
        setCommentSendingPostId(null);
      }
    },
    [commentDraftByPost, handleForumApiError, user],
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

  const refreshComments = useCallback(
    async (postId: string) => {
      if ((commentsByPost[postId]?.length ?? 0) === 0) {
        setCommentsLoadingPostId(postId);
      }
      try {
        const comments = await listForumComments(postId, { init: 0, end: 50 });
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: comments.length } : p,
          ),
        );
      } catch (e) {
        if (await handleForumApiError(e)) return;
      } finally {
        setCommentsLoadingPostId((current) => (current === postId ? null : current));
      }
    },
    [commentsByPost, handleForumApiError],
  );

  const openLikes = useCallback((postId: string) => {
    setLikesSheetPostId(postId);
    setLikesLoadingPostId(postId);
    void listForumLikes(postId, { init: 0, end: 100 })
      .then((rows) => {
        setLikesByPost((prev) => ({ ...prev, [postId]: rows }));
        if (rows.length > 0) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, likesCount: rows.length } : p)),
          );
        }
      })
      .catch(() => {
        setLikesByPost((prev) => ({ ...prev, [postId]: prev[postId] ?? [] }));
      })
      .finally(() => {
        setLikesLoadingPostId((current) => (current === postId ? null : current));
      });
  }, []);

  const commentsSheetPost = posts.find((post) => post.id === commentsSheetPostId) ?? null;
  const likesSheetPost = posts.find((post) => post.id === likesSheetPostId) ?? null;

  const cards = (
    <>
      {officialOnly ? <Text style={styles.sectionTitle}>Publicações oficiais</Text> : null}
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
            {officialOnly ? 'Nenhuma publicação oficial ainda' : 'Nenhuma publicação ainda'}
          </Text>
          <Text style={styles.emptyHint}>
            {officialOnly
              ? 'Comunicados oficiais da Prefeitura aparecerão aqui.'
              : 'Publicações de canais aparecem na aba Comunidade.'}
          </Text>
        </View>
      ) : null}
      {!loading && !error
        ? posts.map((post, index) => (
            <ForumPostCard
              key={post.id}
              showDivider={index < posts.length - 1}
              post={post}
              comments={commentsByPost[post.id] ?? []}
              imageCacheEpoch={imageEpoch}
              commentDraft=""
              commentsExpanded={false}
              commentSending={false}
              canInteract={canInteract}
              onLike={() => void onLike(post.id)}
              onOpenLikes={() => openLikes(post.id)}
              onToggleComments={() => {
                setCommentsSheetPostId(post.id);
                void refreshComments(post.id);
              }}
              onCommentDraftChange={(t) =>
                setCommentDraftByPost((prev) => ({ ...prev, [post.id]: t }))
              }
              onSendComment={() => void onSendComment(post.id)}
              onOpenStore={() => openForumCommercialStoreProfile(post, router)}
              onRemoved={() => setPosts((prev) => prev.filter((item) => item.id !== post.id))}
            />
          ))
        : null}
      <FeedLikesSheet
        visible={!!likesSheetPost}
        likers={likesSheetPostId ? (likesByPost[likesSheetPostId] ?? []) : []}
        likesCount={likesSheetPost?.likesCount ?? 0}
        loading={!!likesSheetPostId && likesLoadingPostId === likesSheetPostId}
        onClose={() => setLikesSheetPostId(null)}
      />
      <FeedCommentsSheet
        visible={!!commentsSheetPost}
        title="Comentários"
        comments={commentsSheetPostId ? (commentsByPost[commentsSheetPostId] ?? []) : []}
        commentDraft={commentsSheetPostId ? (commentDraftByPost[commentsSheetPostId] ?? '') : ''}
        commentsLoading={
          !!commentsSheetPostId && commentsLoadingPostId === commentsSheetPostId
        }
        commentSending={!!commentsSheetPostId && commentSendingPostId === commentsSheetPostId}
        canInteract={canInteract}
        commentsCount={commentsSheetPost?.commentsCount ?? 0}
        onClose={() => setCommentsSheetPostId(null)}
        onCommentDraftChange={(text) => {
          if (!commentsSheetPostId) return;
          setCommentDraftByPost((prev) => ({ ...prev, [commentsSheetPostId]: text }));
        }}
        onSendComment={() => {
          if (!commentsSheetPostId) return;
          const postId = commentsSheetPostId;
          void requestForumComment(() => {
            void onSendComment(postId);
          });
        }}
      />
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{cards}</View>;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={listRef}
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      >
        {cards}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0, backgroundColor: '#ffffff' },
  embedded: { backgroundColor: '#ffffff' },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text.primary,
  },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: 100, paddingTop: 2 },
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
