import {
  CommunityChannelDetailHeader,
  CommunityFeedEmpty,
  CommunityFeedSectionHeader,
} from '@/components/forum/CommunityChannelDetailSections';
import { forumListItemToFeedPost } from '@/components/forum/forumUtils';
import ForumPostCard from '@/components/forum/ForumPostCard';
import ForumPublishFab from '@/components/forum/ForumPublishFab';
import { communityCoverUrl, parseCommunityCoords } from '@/services/forumCommunityApi';
import {
  createForumComment,
  createForumPost,
  findRecentlyCreatedForumPostId,
  likeForumPost,
  listForumComments,
  listForumPosts,
  updateForumPost,
  uploadForumImageFromUri,
  type ForumPostCommentListItemDto,
  type ForumPostResponseDto,
} from '@/services/forumApi';
import {
  deleteForumCommunity,
  followForumCommunity,
  getForumCommunity,
  leaveForumCommunity,
  unfollowForumCommunity,
  type ForumCommunityDetail,
} from '@/services/forumCommunityApi';
import {
  getCachedCommunityDetail,
  invalidateCommunityDetailCache,
  setCachedCommunityDetail,
} from '@/services/forumCommunityCache';
import { shouldAppRefetch } from '@/utils/appRefreshPolicy';
import { AppColors } from '@/constants/theme';
import { VisitanteRestrictedZone } from '@/components/VisitanteRestrictedZone';
import { useAuth } from '@/contexts/AuthContext';
import { useForumModeration } from '@/contexts/ForumModerationContext';
import { useCanInteractAsCitizen, useIsVisitante } from '@/hooks/useIsVisitante';
import { confirmAndSubmitForumReport } from '@/utils/forumReportFlow';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CommunityChannelScreen({ feedMode = false }: { feedMode?: boolean }) {
  const insets = useSafeAreaInsets();
  const { handleForumApiError } = useForumModeration();
  const { user } = useAuth();
  const isVisitante = useIsVisitante();
  const canInteract = useCanInteractAsCitizen();
  const params = useLocalSearchParams<{ id?: string }>();
  const isFeed = feedMode;
  const communityId = String(params.id ?? '').trim();
  const initialDetailCache = communityId ? getCachedCommunityDetail(communityId) : null;

  const [community, setCommunity] = useState<ForumCommunityDetail | null>(
    () => initialDetailCache?.community ?? null,
  );
  const [posts, setPosts] = useState<ForumPostResponseDto[]>(
    () => initialDetailCache?.posts ?? [],
  );
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentsExpandedByPost, setCommentsExpandedByPost] = useState<Record<string, boolean>>(
    {},
  );
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !initialDetailCache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);

  const canPost = !!(user && community?.canPost && !isVisitante);
  const canReportCommunity = !!(community && community.myRole !== 'OWNER' && !isVisitante);
  const coords = community ? parseCommunityCoords(community) : null;

  const load = useCallback(
    async (options?: { force?: boolean; isRefresh?: boolean }) => {
      const force = options?.force ?? false;
      const isRefresh = options?.isRefresh ?? false;

      if (!communityId) {
        setError('Comunidade inválida.');
        setLoading(false);
        return;
      }

      const cached = getCachedCommunityDetail(communityId);
      if (!force && cached) {
        setCommunity(cached.community);
        setPosts(cached.posts);
        setLoading(false);
        if (!shouldAppRefetch(cached.loadedAt, { hasData: true })) return;
      } else if (!cached) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
      } else if (isRefresh) {
        setRefreshing(true);
      }

      setError(null);
      try {
        const detail = await getForumCommunity(communityId);
        const rows = await listForumPosts(undefined, {
          communityId,
          init: 0,
          end: 30,
        });
        const feedPosts = rows.map((row) => forumListItemToFeedPost(row));
        setCommunity(detail);
        setPosts(feedPosts);
        setCommentsExpandedByPost({});
        setCommentsByPost({});
        setImageEpoch(Date.now());
        setCachedCommunityDetail(communityId, detail, feedPosts);
      } catch (e) {
        if (!cached) {
          setCommunity(null);
          setPosts([]);
          setError(e instanceof Error ? e.message : 'Não foi possível carregar a comunidade.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [communityId],
  );

  useFocusEffect(
    useCallback(() => {
      void load({ force: false });
    }, [load]),
  );

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

  const runAction = useCallback(
    async (fn: () => Promise<void>) => {
      if (isVisitante) {
        promptVisitanteLogin('interagir com este canal');
        return;
      }
      setActionLoading(true);
      setError(null);
      try {
        await fn();
        invalidateCommunityDetailCache(communityId);
        await load({ force: true, isRefresh: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ação não concluída.');
      } finally {
        setActionLoading(false);
      }
    },
    [communityId, isVisitante, load],
  );

  const onFollow = () => void runAction(() => followForumCommunity(communityId));
  const onUnfollow = () => void runAction(() => unfollowForumCommunity(communityId));
  const onLeave = () => {
    Alert.alert('Sair da comunidade', 'Deseja deixar de participar deste canal?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => void runAction(() => leaveForumCommunity(communityId)),
      },
    ]);
  };

  const onDeleteCommunity = () => {
    Alert.alert('Excluir comunidade', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteForumCommunity(communityId);
              router.back();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Não foi possível excluir.');
            }
          })(),
      },
    ]);
  };

  const openMap = useCallback(() => {
    if (!coords || !communityId) return;
    router.push({
      pathname: '/forum/communities/map',
      params: { id: communityId },
    });
  }, [communityId, coords]);

  const onPublish = useCallback(async () => {
    if (!postTitle.trim() || !postContent.trim() || !canPost) return;
    setPublishing(true);
    setError(null);
    try {
      const payload = {
        title: postTitle.trim(),
        content: postContent.trim(),
        postType: 'community',
        communityId,
      };
      await createForumPost(undefined, payload);
      if (postImageUri) {
        const createdPostId = await findRecentlyCreatedForumPostId(payload);
        if (createdPostId) {
          const up = await uploadForumImageFromUri(postImageUri);
          await updateForumPost(createdPostId, { mediaId: up.id });
        }
      }
      setPublishOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostImageUri(null);
      invalidateCommunityDetailCache(communityId);
      await load({ force: true, isRefresh: true });
    } catch (e) {
      if (await handleForumApiError(e)) return;
      setError(e instanceof Error ? e.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }, [canPost, communityId, handleForumApiError, load, postContent, postImageUri, postTitle]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPostImageUri(result.assets[0].uri);
    }
  }, []);

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
      await load({ force: true, isRefresh: true });
    }
  }, [load]);

  const actionButtons = useMemo(() => {
    if (!community) return null;
    const busy = actionLoading;

    if (community.myRole === 'OWNER') {
      return (
        <Pressable
          style={[styles.actionBtnDanger, busy && styles.actionDisabled]}
          onPress={onDeleteCommunity}
          disabled={busy}
        >
          <Ionicons name="trash-outline" size={20} color={AppColors.status.error} />
          <Text style={styles.actionBtnDangerText}>Excluir comunidade</Text>
        </Pressable>
      );
    }

    if (community.isMember) {
      return (
        <Pressable
          style={[styles.actionBtnOutline, busy && styles.actionDisabled]}
          onPress={onLeave}
          disabled={busy}
        >
          <Ionicons name="exit-outline" size={20} color={AppColors.text.tertiary} />
          <Text style={styles.actionBtnOutlineText}>Sair da comunidade</Text>
        </Pressable>
      );
    }

    if (community.isFollowing) {
      return (
        <Pressable
          style={[styles.actionBtnOutline, busy && styles.actionDisabled]}
          onPress={onUnfollow}
          disabled={busy}
        >
          <Ionicons name="remove-circle-outline" size={20} color="#0e7490" />
          <Text style={[styles.actionBtnOutlineText, { color: '#0e7490' }]}>
            Deixar de seguir o canal
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        style={[styles.actionBtnPrimary, busy && styles.actionDisabled]}
        onPress={onFollow}
        disabled={busy}
      >
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.actionBtnPrimaryText}>Seguir canal</Text>
      </Pressable>
    );
  }, [actionLoading, community, onDeleteCommunity, onFollow, onLeave, onUnfollow]);

  if (loading && !community) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator color={AppColors.primary} size="large" />
        <Text style={styles.centerText}>Carregando canal...</Text>
      </View>
    );
  }

  if (error && !community) {
    return (
      <View style={styles.centerFull}>
        <Ionicons name="lock-closed-outline" size={48} color={AppColors.text.quaternary} />
        <Text style={styles.errorTitle}>Acesso indisponível</Text>
        <Text style={styles.centerText}>{error}</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  if (!community) return null;

  const postHint = (() => {
    if (!user || canPost) return null;
    if (community.privacy === 'PRIVATE') {
      return 'Canal privado — somente o criador pode publicar.';
    }
    if (!community.isFollowing) {
      return 'Siga o canal para poder publicar aqui.';
    }
    return null;
  })();

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: isFeed ? community.name : 'Perfil da comunidade' }} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load({ force: true, isRefresh: true })}
          />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isFeed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${community.name}`}
            style={styles.feedHeader}
            onPress={() => router.push({ pathname: '/forum/communities/[id]', params: { id: communityId } })}
          >
            {communityCoverUrl(community) ? (
              <Image source={{ uri: communityCoverUrl(community)! }} style={styles.feedCover} />
            ) : (
              <View style={[styles.feedCover, styles.feedCoverPlaceholder]}>
                <Ionicons name="people" size={48} color="#fff" />
              </View>
            )}
            <View style={styles.feedHeading}>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedName}>{community.name}</Text>
                <Text style={styles.feedProfileHint}>Ver perfil da comunidade</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={AppColors.text.tertiary} />
            </View>
          </Pressable>
        ) : <CommunityChannelDetailHeader
          community={community}
          imageEpoch={imageEpoch}
          postsCount={posts.length}
          actionButtons={
            isVisitante && actionButtons ? (
              <VisitanteRestrictedZone message="Para seguir, participar ou gerenciar este canal, faça login com uma conta cadastrada.">
                {actionButtons}
              </VisitanteRestrictedZone>
            ) : (
              actionButtons
            )
          }
          onOpenMap={coords ? openMap : undefined}
        />}

        {!isFeed && canReportCommunity ? (
          <Pressable
            style={({ pressed }) => [
              styles.reportChannelBtn,
              pressed && styles.reportChannelBtnPressed,
            ]}
            onPress={() =>
              confirmAndSubmitForumReport('FORUM_COMMUNITY', community.id, { canInteract })
            }
            accessibilityRole="button"
            accessibilityLabel="Denunciar canal"
          >
            <Ionicons name="flag-outline" size={18} color={AppColors.status.error} />
            <Text style={styles.reportChannelText}>Denunciar canal</Text>
          </Pressable>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {isFeed ? <CommunityFeedSectionHeader
          postsCount={posts.length}
          canPost={canPost}
          postHint={postHint}
        /> : null}

        {isFeed && (posts.length === 0 ? (
          <CommunityFeedEmpty />
        ) : (
          <View style={styles.postsList}>
            {posts.map((post, index) => (
                <ForumPostCard
                  key={post.id}
                  showDivider={index < posts.length - 1}
                  post={post}
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
            ))}
          </View>
        ))}
      </ScrollView>

      {isFeed && canPost ? (
        <ForumPublishFab
          onOpenPublish={() => setPublishOpen(true)}
          bottomOffset={Math.max(insets.bottom, 12)}
        />
      ) : null}

      <Modal visible={publishOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova publicação</Text>
            <Text style={styles.modalSubtitle}>Canal: {community.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={AppColors.text.quaternary}
              value={postTitle}
              onChangeText={setPostTitle}
              maxLength={255}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Escreva sua mensagem..."
              placeholderTextColor={AppColors.text.quaternary}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              textAlignVertical="top"
            />
            <Pressable style={styles.photoPickBtn} onPress={() => void pickImage()}>
              <Ionicons name="image-outline" size={18} color={AppColors.text.secondary} />
              <Text style={styles.photoPickText}>
                {postImageUri ? 'Trocar foto' : 'Adicionar foto (opcional)'}
              </Text>
            </Pressable>
            {postImageUri ? (
              <Image source={{ uri: postImageUri }} style={styles.photoPreview} />
            ) : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPublishOpen(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmBtn,
                  (!postTitle.trim() || !postContent.trim() || publishing) &&
                    styles.confirmBtnDisabled,
                ]}
                onPress={() => void onPublish()}
                disabled={!postTitle.trim() || !postContent.trim() || publishing}
              >
                {publishing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmText}>Publicar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  feedHeader: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  feedCover: { width: '100%', height: 160 },
  feedCoverPlaceholder: { backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center' },
  feedHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  feedName: { fontSize: 22, fontWeight: '800', color: AppColors.text.primary },
  feedProfileHint: { marginTop: 4, fontSize: 13, color: AppColors.text.tertiary },
  flex: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { paddingTop: 8, paddingBottom: 100 },
  centerFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600', textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text.secondary },
  backLink: { marginTop: 12, padding: 12 },
  backLinkText: { color: '#0891b2', fontWeight: '800', fontSize: 16 },
  errorBox: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  errorText: { color: AppColors.status.error, fontWeight: '700' },
  reportChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  reportChannelBtnPressed: { opacity: 0.85 },
  reportChannelText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.status.error,
  },
  postsList: {},
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.muted,
  },
  actionBtnOutlineText: { fontWeight: '700', fontSize: 15, color: AppColors.text.tertiary },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  actionBtnDangerText: { fontWeight: '800', fontSize: 15, color: AppColors.status.error },
  actionDisabled: { opacity: 0.5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: AppColors.text.secondary },
  modalSubtitle: { fontSize: 13, color: '#0891b2', fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: AppColors.text.secondary,
  },
  textarea: { minHeight: 110 },
  photoPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  photoPickText: { fontWeight: '700', color: AppColors.text.secondary },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: AppColors.background.muted,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: { fontWeight: '700', color: AppColors.text.tertiary },
  confirmBtn: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmText: { color: '#fff', fontWeight: '800' },
});
