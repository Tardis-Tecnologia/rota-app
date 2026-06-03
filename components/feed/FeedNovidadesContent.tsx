import FeedNovidadeCard from '@/components/feed/FeedNovidadeCard';
import FilterTabs, { type FilterOption } from '@/components/FilterTabs';
import FeedMuralHeader from '@/components/feed/FeedMuralHeader';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanInteractAsCitizen } from '@/hooks/useIsVisitante';
import type { useFeedNovidades } from '@/hooks/useFeedNovidades';
import {
  buildOptimisticNewsComment,
  createNewsComment,
  likeNews,
  listNewsComments,
  mergeNewsCommentsWithPending,
  type NewsCommentListItemDto,
} from '@/services/newsApi';
import { FeedFilter } from '@/types';
import type { FeedNovidade } from '@/types/feedNovidade';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
  const [commentsExpandedByPost, setCommentsExpandedByPost] = useState<Record<string, boolean>>({});
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState<string | null>(null);
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);

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
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: mergeNewsCommentsWithPending(rows, prev[postId] ?? []),
        }));
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: prev[postId] ?? [] }));
      } finally {
        if (showLoading) setCommentsLoadingPostId(null);
      }
    },
    [commentsByPost, items],
  );

  const onToggleComments = useCallback(
    (postId: string) => {
      const willExpand = !commentsExpandedByPost[postId];
      setCommentsExpandedByPost((prev) => ({ ...prev, [postId]: willExpand }));
      if (willExpand && commentsByPost[postId] === undefined) {
        void loadCommentsForPost(postId);
      }
    },
    [commentsByPost, commentsExpandedByPost, loadCommentsForPost],
  );

  const onSendComment = useCallback(
    async (postId: string) => {
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
      setCommentsExpandedByPost((prev) => ({ ...prev, [postId]: true }));
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
      setLikeError(null);
      const current = items.find((i) => i.id === postId);
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
          <Ionicons name="newspaper-outline" size={44} color={AppColors.text.quaternary} />
          <Text style={styles.emptyTitle}>Nenhuma publicação ainda</Text>
          <Text style={styles.emptyHint}>
            Os comunicados oficiais da Prefeitura aparecerão aqui.
          </Text>
        </View>
      ) : (
        <>
          {items.map((item, index) => (
            <FeedNovidadeCard
              key={`${activeFilter}-${item.id}`}
              item={item}
              imageCacheEpoch={imageEpoch}
              comments={commentsByPost[item.id] ?? []}
              commentDraft={commentDraftByPost[item.id] ?? ''}
              commentsExpanded={!!commentsExpandedByPost[item.id]}
              commentsLoading={commentsLoadingPostId === item.id}
              commentSending={commentSendingPostId === item.id}
              canInteract={canInteract}
              onOpenDetail={() => openDetail(item)}
              onLike={() => void onLike(item.id)}
              onToggleComments={() => onToggleComments(item.id)}
              onCommentDraftChange={(text) =>
                setCommentDraftByPost((prev) => ({ ...prev, [item.id]: text }))
              }
              onSendComment={() => void onSendComment(item.id)}
              showDivider={index < items.length - 1 || hasMore}
            />
          ))}
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
