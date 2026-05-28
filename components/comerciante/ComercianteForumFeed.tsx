import FilterTabs, { type FilterOption } from '@/components/FilterTabs';
import ForumAllPostsSection from '@/components/forum/ForumAllPostsSection';
import ForumCommunitySection from '@/components/forum/ForumCommunitySection';
import ForumPostCard from '@/components/forum/ForumPostCard';
import { FORUM_LOST_ANIMAL_POST_TYPE } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { emailToStoreHandle } from '@/utils/comercianteHandle';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS: FilterOption[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'community', label: 'Comunidade' },
  { key: 'lost_animal', label: 'Perdidos' },
];

function ComercianteLostPostsSection({
  refreshing,
  onRefresh,
  onRefreshComplete,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onRefreshComplete: () => void;
}) {
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
      const rows = await listForumPosts(undefined, {
        postType: FORUM_LOST_ANIMAL_POST_TYPE,
        init: 0,
        end: 40,
      });
      const detailed = await Promise.all(rows.slice(0, 20).map((r) => getForumPost(r.id)));
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
      setError(e instanceof Error ? e.message : 'Não foi possível carregar avisos de perdidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

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

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Nenhum aviso de animal perdido no momento.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.lostScroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
    >
      {posts.map((post) => (
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
      ))}
    </ScrollView>
  );
}

export default function ComercianteForumFeed() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [refreshing, setRefreshing] = useState(false);
  const [allFeedReloadToken, setAllFeedReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const lojaNome = user?.name?.trim() || 'Minha loja';
  const lojaHandle = emailToStoreHandle(user?.email ?? 'loja@rota.com');

  const isCommunityHub = activeFilter === 'community';
  const isAllPosts = activeFilter === 'todos';
  const isLost = activeFilter === 'lost_animal';

  const onPublish = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        postType: 'community' as const,
      };
      await createForumPost(undefined, payload);
      if (imageUri) {
        const createdPostId = await findRecentlyCreatedForumPostId(payload);
        if (!createdPostId) {
          throw new Error(
            'Publicação criada, mas não foi possível localizar o post para anexar a foto.',
          );
        }
        const up = await uploadForumImageFromUri(imageUri);
        await updateForumPost(createdPostId, { mediaId: up.id });
      }
      setPublishOpen(false);
      setTitle('');
      setContent('');
      setImageUri(null);
      setAllFeedReloadToken((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }, [content, imageUri, title]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const canPublish = useMemo(
    () => title.trim().length > 0 && content.trim().length > 0 && !publishing,
    [content, publishing, title],
  );

  const startRefresh = useCallback(() => setRefreshing(true), []);
  const endRefresh = useCallback(() => setRefreshing(false), []);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarSpacer} />
          <View style={styles.topBarCenter}>
            <Text style={styles.screenTitle}>Fórum do bairro</Text>
            <Text style={styles.screenSubtitle}>
              Opiniões, dúvidas e avisos. Publicações de animais perdidos vindas da central de
              serviços aparecem aqui automaticamente.
            </Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        <FilterTabs
          filters={FILTERS}
          active={activeFilter}
          onSelect={setActiveFilter}
          compact
          containerStyle={{ paddingBottom: 0 }}
        />

        <View style={styles.identityBar}>
          <Ionicons name="people-outline" size={18} color="#0f766e" />
          <Text style={styles.identityText}>
            Você participa como <Text style={styles.identityBold}>{lojaNome}</Text> ({lojaHandle}
            ).
          </Text>
        </View>
      </View>

      {isCommunityHub ? (
        <ForumCommunitySection
          refreshing={refreshing}
          onRefresh={startRefresh}
          onRefreshComplete={endRefresh}
        />
      ) : isLost ? (
        <ComercianteLostPostsSection
          refreshing={refreshing}
          onRefresh={startRefresh}
          onRefreshComplete={endRefresh}
        />
      ) : isAllPosts ? (
        <ForumAllPostsSection
          refreshing={refreshing}
          onRefresh={startRefresh}
          onRefreshComplete={endRefresh}
          reloadToken={allFeedReloadToken}
        />
      ) : null}

      {isAllPosts || isCommunityHub ? (
        <TouchableOpacity
          style={styles.publishBtn}
          activeOpacity={0.9}
          onPress={() => setPublishOpen(true)}
        >
          <LinearGradient
            colors={['#0891b2', '#14b8a6']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.publishBtnGradient}
          >
            <Ionicons name="chatbubble-outline" size={20} color={AppColors.text.white} />
            <Text style={styles.publishBtnText}>Publicar</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      {error ? (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>{error}</Text>
        </View>
      ) : null}

      <Modal
        visible={publishOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPublishOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova publicação</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={title}
              onChangeText={setTitle}
              maxLength={255}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Sua mensagem..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={20000}
            />
            <Pressable style={styles.photoPickBtn} onPress={() => void pickImage()}>
              <Ionicons name="image-outline" size={18} color={AppColors.text.secondary} />
              <Text style={styles.photoPickText}>
                {imageUri ? 'Trocar foto' : 'Selecionar foto'}
              </Text>
            </Pressable>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.photoPreview} /> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPublishOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => void onPublish()}
                disabled={!canPublish}
                style={[styles.confirmBtn, !canPublish && styles.confirmBtnDisabled]}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color={AppColors.text.white} />
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
  container: { flex: 1, backgroundColor: '#ECEFF3' },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topBarSpacer: { width: 32 },
  topBarCenter: { flex: 1, gap: 6, alignItems: 'center' },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    textAlign: 'center',
  },
  identityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  identityText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  identityBold: {
    fontWeight: '700',
    color: '#0f766e',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
  },
  lostScroll: {
    padding: 12,
    gap: 12,
    paddingBottom: 100,
  },
  errorToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 80,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.95)',
  },
  errorToastText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  publishBtn: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  publishBtnGradient: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishBtnText: { color: AppColors.text.white, fontWeight: '900', fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: AppColors.text.secondary },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: AppColors.text.secondary,
    backgroundColor: AppColors.background.default,
  },
  photoPickBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPickText: {
    color: AppColors.text.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: AppColors.background.muted,
  },
  textarea: { minHeight: 96 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelText: { color: AppColors.text.tertiary, fontWeight: '700', fontSize: 16 },
  confirmBtn: {
    backgroundColor: AppColors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 96,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmText: { color: AppColors.text.white, fontWeight: '800', fontSize: 16 },
});
