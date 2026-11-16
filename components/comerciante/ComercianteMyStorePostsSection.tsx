import ForumFeedContextChip from '@/components/forum/ForumFeedContextChip';
import ForumPostCard from '@/components/forum/ForumPostCard';
import { isForumPostOwnedByUser } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  listForumComments,
  type ForumPostCommentListItemDto,
  type ForumPostResponseDto,
} from '@/services/forumApi';
import {
  deleteCommercialForumPost,
  getCommercialForumPost,
  listCommercialForumPosts,
} from '@/services/commercialForumApi';
import {
  commercialForumDetailToPost,
  commercialForumItemToPost,
} from '@/utils/commercialForumMappers';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ComercianteMyStorePostsSectionProps {
  refreshing: boolean;
  onRefresh: () => void;
  onRefreshComplete: () => void;
  reloadToken: number;
}

export default function ComercianteMyStorePostsSection({
  refreshing,
  onRefresh,
  onRefreshComplete,
  reloadToken,
}: ComercianteMyStorePostsSectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPostResponseDto[]>([]);
  const [commercialIdsByForumPost, setCommercialIdsByForumPost] = useState<Record<string, string>>(
    {},
  );
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentsExpandedByPost, setCommentsExpandedByPost] = useState<Record<string, boolean>>(
    {},
  );

  const storeFallback = useMemo(
    () => ({
      id: user?.id ?? 'store',
      storeName: user?.name?.trim() || 'Minha loja',
      photoUrl: user?.photoUrl ?? null,
    }),
    [user?.id, user?.name, user?.photoUrl],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listCommercialForumPosts({ init: 0, end: 40 });
      const idMap: Record<string, string> = {};
      rows.forEach((item) => {
        idMap[item.forumPostId] = item.id;
      });
      setCommercialIdsByForumPost(idMap);

      const detailed = await Promise.all(
        rows.slice(0, 25).map(async (item) => {
          try {
            const detail = await getCommercialForumPost(item.id);
            return commercialForumDetailToPost(detail, storeFallback);
          } catch {
            return commercialForumItemToPost(item, storeFallback);
          }
        }),
      );

      const commentEntries = await Promise.all(
        detailed.map(async (p) => {
          try {
            const comments = await listForumComments(p.id, { init: 0, end: 50 });
            return [p.id, comments] as const;
          } catch {
            return [p.id, []] as const;
          }
        }),
      );
      setCommentsByPost(Object.fromEntries(commentEntries));
      setPosts(detailed);
      setCommentsExpandedByPost({});
      setImageEpoch(Date.now());
    } catch (e) {
      setPosts([]);
      setCommentsByPost({});
      setError(e instanceof Error ? e.message : 'Não foi possível carregar suas publicações.');
    } finally {
      setLoading(false);
    }
  }, [storeFallback.id, storeFallback.photoUrl, storeFallback.storeName]);

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

  const onDeletePost = useCallback(
    (forumPostId: string) => {
      const commercialId = commercialIdsByForumPost[forumPostId];
      if (!commercialId) return;
      Alert.alert('Excluir publicação', 'Deseja remover esta promoção do feed?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteCommercialForumPost(commercialId);
                await load();
              } catch (e) {
                Alert.alert(
                  'Erro',
                  e instanceof Error ? e.message : 'Não foi possível excluir.',
                );
              }
            })();
          },
        },
      ]);
    },
    [commercialIdsByForumPost, load],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.stickyHeader}>
        <ForumFeedContextChip label="Minhas publicações no feed" />
      </View>

      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
        }
        contentContainerStyle={styles.listContent}
      >
        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color="#0d9488" />
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
            <Ionicons name="storefront-outline" size={32} color={AppColors.text.quaternary} />
            <Text style={styles.emptyTitle}>Nenhuma publicação da loja</Text>
            <Text style={styles.emptyHint}>
              Toque em Publicar para divulgar promoções no feed da cidade.
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
                commentsExpanded={!!commentsExpandedByPost[post.id]}
                commentSending={false}
                canInteract={false}
                onLike={() => {}}
                onToggleComments={() =>
                  setCommentsExpandedByPost((prev) => ({
                    ...prev,
                    [post.id]: !prev[post.id],
                  }))
                }
                onCommentDraftChange={() => {}}
                onSendComment={() => {}}
                onDelete={
                  isForumPostOwnedByUser(post, user?.id)
                    ? () => onDeletePost(post.id)
                    : undefined
                }
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
