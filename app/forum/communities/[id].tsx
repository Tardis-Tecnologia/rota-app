import {
  CommunityChannelDetailHeader,
  CommunityFeedEmpty,
  CommunityFeedSectionHeader,
} from '@/components/forum/CommunityChannelDetailSections';
import ForumPostCard from '@/components/forum/ForumPostCard';
import { parseCommunityCoords } from '@/services/forumCommunityApi';
import {
  createForumComment,
  createForumPost,
  findRecentlyCreatedForumPostId,
  getForumPost,
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
import { AppColors } from '@/constants/theme';
import { VisitanteRestrictedZone } from '@/components/VisitanteRestrictedZone';
import { useAuth } from '@/contexts/AuthContext';
import { useCanInteractAsCitizen, useIsVisitante } from '@/hooks/useIsVisitante';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function CommunityChannelScreen() {
  const { user } = useAuth();
  const isVisitante = useIsVisitante();
  const canInteract = useCanInteractAsCitizen();
  const params = useLocalSearchParams<{ id?: string }>();
  const communityId = String(params.id ?? '').trim();

  const [community, setCommunity] = useState<ForumCommunityDetail | null>(null);
  const [posts, setPosts] = useState<ForumPostResponseDto[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentsExpandedByPost, setCommentsExpandedByPost] = useState<Record<string, boolean>>(
    {},
  );
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
  const coords = community ? parseCommunityCoords(community) : null;

  const load = useCallback(
    async (isRefresh = false) => {
      if (!communityId) {
        setError('Comunidade inválida.');
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const detail = await getForumCommunity(communityId);
        setCommunity(detail);
        const rows = await listForumPosts(undefined, {
          communityId,
          init: 0,
          end: 30,
        });
        const detailed = await Promise.all(rows.map((r) => getForumPost(r.id)));
        const commentEntries = await Promise.all(
          detailed.map(async (p) => {
            const comments = await listForumComments(p.id, { init: 0, end: 50 });
            return [p.id, comments] as const;
          }),
        );
        setPosts(detailed);
        setCommentsByPost(Object.fromEntries(commentEntries));
        setCommentsExpandedByPost({});
        setImageEpoch(Date.now());
      } catch (e) {
        setCommunity(null);
        setPosts([]);
        setError(e instanceof Error ? e.message : 'Não foi possível carregar a comunidade.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [communityId],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
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
        await load(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ação não concluída.');
      } finally {
        setActionLoading(false);
      }
    },
    [isVisitante, load],
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
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }, [canPost, communityId, load, postContent, postImageUri, postTitle]);

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
      await load(true);
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <CommunityChannelDetailHeader
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
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <CommunityFeedSectionHeader
          postsCount={posts.length}
          canPost={canPost}
          postHint={postHint}
        />

        {posts.length === 0 ? (
          <CommunityFeedEmpty />
        ) : (
          <View style={styles.postsList}>
            {posts.map((post, index) => (
              <View key={post.id}>
                {index > 0 ? <View style={styles.postSeparator} /> : null}
                <ForumPostCard
                  post={post}
                  comments={commentsByPost[post.id] ?? []}
                  imageCacheEpoch={imageEpoch}
                  commentDraft={commentDraftByPost[post.id] ?? ''}
                  commentsExpanded={!!commentsExpandedByPost[post.id]}
                  commentSending={commentSendingPostId === post.id}
                  canInteract={canInteract}
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
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {canPost ? (
        <Pressable style={styles.publishFab} onPress={() => setPublishOpen(true)}>
          <LinearGradient
            colors={['#0891b2', '#14b8a6']}
            style={styles.publishFabGradient}
          >
            <Ionicons name="create-outline" size={22} color="#fff" />
            <Text style={styles.publishFabText}>Publicar</Text>
          </LinearGradient>
        </Pressable>
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
  flex: { flex: 1, backgroundColor: '#ECEFF3' },
  scroll: { paddingTop: 8, paddingBottom: 100, gap: 4 },
  centerFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#ECEFF3',
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
  postsList: { gap: 0 },
  postSeparator: {
    height: 8,
    backgroundColor: 'transparent',
  },
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
  publishFab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  publishFabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  publishFabText: { color: '#fff', fontWeight: '900', fontSize: 15 },
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
