import FeedCommentsSheet from '@/components/feed/FeedCommentsSheet';
import FeedLikesSheet, { type FeedLiker } from '@/components/feed/FeedLikesSheet';
import FeedNovidadeCard from '@/components/feed/FeedNovidadeCard';
import FeedPinnedNovidadeCard from '@/components/feed/FeedPinnedNovidadeCard';
import FeedPollCard from '@/components/feed/FeedPollCard';
import FilterTabs, { type FilterOption } from '@/components/FilterTabs';
import FeedMuralHeader from '@/components/feed/FeedMuralHeader';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanInteractAsCitizen } from '@/hooks/useIsVisitante';
import type { useFeedNovidades } from '@/hooks/useFeedNovidades';
import {
  buildOptimisticNewsComment,
  createNewsComment,
  getNewsById,
  likeNews,
  listNewsComments,
  listNewsLikes,
  mergeNewsCommentsWithPending,
  newsItemToFeedItem,
  type NewsCommentListItemDto,
} from '@/services/newsApi';
import { createPollVote } from '@/services/pollsApi';
import { FeedFilter } from '@/types';
import type { FeedNovidade } from '@/types/feedNovidade';
import { isFeedPollItem } from '@/types/feedNovidade';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const FILTERS: FilterOption[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'noticias', label: 'Notícias' },
  { key: 'enquetes', label: 'Enquetes' },
  { key: 'obras', label: 'Obras' },
  { key: 'lazer', label: 'Lazer' },
];

const COMMENTS_PREVIEW_END = 50;

type FeedState = ReturnType<typeof useFeedNovidades>;

type FeedNovidadesContentProps = {
  feed: FeedState;
  showLoadMore?: boolean;
  variant?: 'home' | 'standalone';
};

export default function FeedNovidadesContent({
  feed,
  showLoadMore = true,
  variant = 'standalone',
}: FeedNovidadesContentProps) {
  const isHome = variant === 'home';
  const { user } = useAuth();
  const canInteract = useCanInteractAsCitizen();
  const {
    activeFilter,
    setActiveFilter,
    items,
    updateItem,
    hasMore,
    loading,
    loadingMore,
    error,
    imageEpoch,
    loadInitial,
    loadMore,
  } = feed;

  const [likeError, setLikeError] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, NewsCommentListItemDto[] | undefined>
  >({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentsSheetPostId, setCommentsSheetPostId] = useState<string | null>(null);
  const [likesSheetPostId, setLikesSheetPostId] = useState<string | null>(null);
  const [likesByPost, setLikesByPost] = useState<Record<string, FeedLiker[]>>({});
  const [likesLoadingPostId, setLikesLoadingPostId] = useState<string | null>(null);
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState<string | null>(null);
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);
  const [pollVoteSendingId, setPollVoteSendingId] = useState<string | null>(null);
  const [pollVoteErrorById, setPollVoteErrorById] = useState<Record<string, string>>({});

  const commentsSheetPost = useMemo(
    () => (commentsSheetPostId ? items.find((i) => i.id === commentsSheetPostId) ?? null : null),
    [commentsSheetPostId, items],
  );

  const openDetail = (item: FeedNovidade) => {
    router.push({
      pathname: '/novidade/[id]',
      params: { id: item.id },
    });
  };

  const ensureCanInteract = useCallback((): boolean => {
    if (canInteract) return true;
    promptVisitanteLogin('curtir e comentar comunicados');
    return false;
  }, [canInteract]);

  const ensureCanVote = useCallback((): boolean => {
    if (canInteract) return true;
    promptVisitanteLogin('votar nas enquetes');
    return false;
  }, [canInteract]);

  const onVotePoll = useCallback(
    async (item: FeedNovidade, optionIndex: number) => {
      if (!ensureCanVote()) return;
      const pollId = item.pollId ?? item.poll?.id;
      if (!pollId || !item.poll) return;

      setPollVoteSendingId(item.id);
      setPollVoteErrorById((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      const poll = item.poll;
      const counts = [...poll.optionCounts];
      while (counts.length < poll.options.length) counts.push(0);
      const prevIndex = poll.selectedOptionIndex;
      if (prevIndex != null && prevIndex >= 0 && prevIndex < counts.length && prevIndex !== optionIndex) {
        counts[prevIndex] = Math.max(0, counts[prevIndex] - 1);
      }
      if (!poll.userVoted || prevIndex !== optionIndex) {
        counts[optionIndex] = (counts[optionIndex] ?? 0) + 1;
      }
      updateItem(item.id, {
        poll: {
          ...poll,
          userVoted: true,
          selectedOptionIndex: optionIndex,
          optionCounts: counts,
        },
      });

      try {
        await createPollVote(pollId, optionIndex, item.hostId ?? undefined);
        const raw = await getNewsById(item.id);
        if (raw) {
          updateItem(item.id, newsItemToFeedItem(raw));
        }
      } catch (e) {
        void loadInitial();
        const msg = e instanceof Error ? e.message : 'Não foi possível registrar o voto.';
        setPollVoteErrorById((prev) => ({ ...prev, [item.id]: msg }));
        Alert.alert('Erro', msg);
      } finally {
        setPollVoteSendingId(null);
      }
    },
    [ensureCanVote, loadInitial, updateItem],
  );

  const loadCommentsForPost = useCallback(
    async (postId: string, options?: { showLoading?: boolean; retryIfEmpty?: boolean }) => {
      const post = items.find((i) => i.id === postId);
      const showLoading = options?.showLoading ?? commentsByPost[postId] === undefined;
      if (showLoading) setCommentsLoadingPostId(postId);
      try {
        const rows = await listNewsComments(postId, {
          init: 0,
          end: COMMENTS_PREVIEW_END,
          hostId: post?.hostId,
          retryIfEmpty: options?.retryIfEmpty,
        });
        const merged = mergeNewsCommentsWithPending(rows, commentsByPost[postId] ?? []);
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: merged,
        }));
        // Mantém o contador alinhado aos comentários reais (evita seed com count fake).
        updateItem(postId, { comentarios: merged.length });
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: prev[postId] ?? [] }));
      } finally {
        if (showLoading) setCommentsLoadingPostId(null);
      }
    },
    [commentsByPost, items, updateItem],
  );

  const onOpenComments = useCallback(
    (postId: string) => {
      const post = items.find((i) => i.id === postId);
      if (post && isFeedPollItem(post)) return;
      setCommentsSheetPostId(postId);
      void loadCommentsForPost(postId, {
        showLoading: (commentsByPost[postId]?.length ?? 0) === 0,
      });
    },
    [commentsByPost, items, loadCommentsForPost],
  );

  const onOpenLikes = useCallback(
    (postId: string) => {
      const post = items.find((i) => i.id === postId);
      if (post && isFeedPollItem(post)) return;
      setLikesSheetPostId(postId);
      setLikesLoadingPostId(postId);
      void listNewsLikes(postId, { init: 0, end: 100, hostId: post?.hostId })
        .then((rows) => {
          setLikesByPost((prev) => ({ ...prev, [postId]: rows }));
          if (rows.length > 0) updateItem(postId, { curtidas: rows.length });
        })
        .catch(() => {
          setLikesByPost((prev) => ({ ...prev, [postId]: prev[postId] ?? [] }));
        })
        .finally(() => {
          setLikesLoadingPostId((current) => (current === postId ? null : current));
        });
    },
    [items, updateItem],
  );

  const onCloseComments = useCallback(() => {
    setCommentsSheetPostId(null);
  }, []);

  const onSendComment = useCallback(
    async (postId: string) => {
      const post = items.find((i) => i.id === postId);
      if (post && isFeedPollItem(post)) return;
      if (!ensureCanInteract() || !user?.id) return;
      const text = (commentDraftByPost[postId] ?? '').trim();
      if (!text) return;

      const optimistic = buildOptimisticNewsComment(text, {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
      });
      const prevCount = items.find((i) => i.id === postId)?.comentarios ?? 0;

      setCommentSendingPostId(postId);
      setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }));
      setCommentsSheetPostId(postId);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), optimistic],
      }));
      updateItem(postId, { comentarios: prevCount + 1 });

      try {
        const post = items.find((i) => i.id === postId);
        await createNewsComment(postId, text, post?.hostId);
        await loadCommentsForPost(postId, { showLoading: false, retryIfEmpty: true });
      } catch (e) {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: (prev[postId] ?? []).filter((c) => c.id !== optimistic.id),
        }));
        updateItem(postId, { comentarios: prevCount });
        setCommentDraftByPost((prev) => ({ ...prev, [postId]: text }));
        Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível comentar.');
      } finally {
        setCommentSendingPostId(null);
      }
    },
    [commentDraftByPost, ensureCanInteract, items, loadCommentsForPost, updateItem, user],
  );

  const onLike = useCallback(
    async (postId: string) => {
      if (!ensureCanInteract()) return;
      const current = items.find((i) => i.id === postId);
      if (current && isFeedPollItem(current)) return;
      setLikeError(null);
      if (current) {
        const wasLiked = !!current.liked;
        updateItem(postId, {
          liked: !wasLiked,
          curtidas: Math.max(0, current.curtidas + (wasLiked ? -1 : 1)),
        });
      }
      try {
        await likeNews(postId);
      } catch (e) {
        void loadInitial();
        const msg = e instanceof Error ? e.message : 'Não foi possível curtir.';
        setLikeError(msg);
        Alert.alert('Erro', msg);
      }
    },
    [ensureCanInteract, items, loadInitial, updateItem],
  );

  const filterBar = (
    <FilterTabs
      filters={FILTERS}
      active={activeFilter}
      onSelect={(key) => setActiveFilter(key as FeedFilter)}
      compact
      edgeToEdge={!isHome}
      variant={isHome ? 'feedTimeline' : 'default'}
      containerStyle={isHome ? styles.homeFilters : undefined}
    />
  );

  const contentShell = (children: React.ReactNode) => (
    <View style={[styles.section, isHome && styles.sectionHome]}>{children}</View>
  );

  if (loading && items.length === 0) {
    return contentShell(
      <>
        {!isHome ? (
          <FeedMuralHeader activeFilter={activeFilter} onSelectFilter={setActiveFilter} />
        ) : (
          filterBar
        )}
        <View style={[styles.centerBlock, isHome && styles.centerBlockHome]}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.centerText}>Carregando…</Text>
        </View>
      </>,
    );
  }

  if (error && items.length === 0) {
    return contentShell(
      <>
        {!isHome ? (
          <FeedMuralHeader activeFilter={activeFilter} onSelectFilter={setActiveFilter} />
        ) : (
          filterBar
        )}
        <View style={[styles.centerBlock, isHome && styles.centerBlockHome]}>
          <Ionicons name="cloud-offline-outline" size={40} color={AppColors.text.quaternary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadInitial()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </>,
    );
  }

  return contentShell(
    <>
      {!isHome ? (
        <FeedMuralHeader activeFilter={activeFilter} onSelectFilter={setActiveFilter} />
      ) : (
        filterBar
      )}

      {likeError ? (
        <View style={styles.likeErrorBox}>
          <Text style={styles.likeErrorText}>{likeError}</Text>
        </View>
      ) : null}

      {items.length === 0 ? (
        <View style={[styles.centerBlock, isHome && styles.centerBlockHome]}>
          <Ionicons
            name={activeFilter === 'enquetes' ? 'stats-chart-outline' : 'newspaper-outline'}
            size={44}
            color={AppColors.text.quaternary}
          />
          <Text style={styles.emptyTitle}>
            {activeFilter === 'enquetes'
              ? 'Nenhuma enquete publicada'
              : 'Nenhuma publicação ainda'}
          </Text>
          <Text style={styles.emptyHint}>
            {activeFilter === 'enquetes'
              ? 'Quando houver enquetes ativas, elas aparecerão aqui para você votar.'
              : 'Os comunicados oficiais da Prefeitura aparecerão aqui.'}
          </Text>
        </View>
      ) : (
        <>
          {items.map((item, index) => {
            if (isFeedPollItem(item)) {
              return (
                <FeedPollCard
                  key={`${activeFilter}-poll-${item.id}`}
                  item={item}
                  canInteract={canInteract}
                  voteSubmitting={pollVoteSendingId === item.id}
                  voteError={pollVoteErrorById[item.id] ?? null}
                  onVote={(optionIndex) => void onVotePoll(item, optionIndex)}
                  showDivider={index < items.length - 1 || hasMore}
                />
              );
            }
            const cardProps = {
              item,
              imageCacheEpoch: imageEpoch,
              canInteract,
              onOpenDetail: () => openDetail(item),
              onLike: () => void onLike(item.id),
              onOpenLikes: () => onOpenLikes(item.id),
              onOpenComments: () => onOpenComments(item.id),
            };

            if (item.isPinned) {
              return (
                <FeedPinnedNovidadeCard
                  key={`${activeFilter}-pinned-${item.id}`}
                  {...cardProps}
                  showDivider={index < items.length - 1 || hasMore}
                />
              );
            }

            return (
              <FeedNovidadeCard
                key={`${activeFilter}-post-${item.id}`}
                {...cardProps}
                showDivider={index < items.length - 1 || hasMore}
              />
            );
          })}
          {showLoadMore && hasMore ? (
            <TouchableOpacity
              style={[styles.loadMoreBtn, isHome && styles.loadMoreBtnHome]}
              onPress={() => void loadMore()}
              disabled={loadingMore}
              activeOpacity={0.85}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={AppColors.primary} />
              ) : (
                <Text style={styles.loadMoreText}>Carregar mais</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <FeedLikesSheet
        visible={!!likesSheetPostId}
        likers={likesSheetPostId ? (likesByPost[likesSheetPostId] ?? []) : []}
        likesCount={
          likesSheetPostId
            ? (items.find((item) => item.id === likesSheetPostId)?.curtidas ?? 0)
            : 0
        }
        loading={!!likesSheetPostId && likesLoadingPostId === likesSheetPostId}
        onClose={() => setLikesSheetPostId(null)}
      />

      <FeedCommentsSheet
        visible={!!commentsSheetPost}
        title="Comentários"
        comments={
          commentsSheetPostId ? (commentsByPost[commentsSheetPostId] ?? []) : []
        }
        commentDraft={
          commentsSheetPostId ? (commentDraftByPost[commentsSheetPostId] ?? '') : ''
        }
        commentsLoading={
          !!commentsSheetPostId && commentsLoadingPostId === commentsSheetPostId
        }
        commentSending={
          !!commentsSheetPostId && commentSendingPostId === commentsSheetPostId
        }
        canInteract={canInteract}
        commentsCount={commentsSheetPost?.comentarios ?? 0}
        onClose={onCloseComments}
        onCommentDraftChange={(text) => {
          if (!commentsSheetPostId) return;
          setCommentDraftByPost((prev) => ({ ...prev, [commentsSheetPostId]: text }));
        }}
        onSendComment={() => {
          if (!commentsSheetPostId) return;
          void onSendComment(commentsSheetPostId);
        }}
      />
    </>,
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  sectionHome: {
    marginBottom: 0,
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 0,
  },
  homeFilters: {
    marginBottom: 4,
  },
  likeErrorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  likeErrorText: {
    fontSize: 13,
    color: AppColors.status.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  centerBlock: {
    minHeight: 160,
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerBlockHome: {
    minHeight: 200,
  },
  centerText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: AppColors.status.error,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eff3f4',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  loadMoreBtnHome: {
    marginBottom: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.tab.active,
  },
});
