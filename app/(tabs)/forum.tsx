import FilterTabs, { type FilterOption } from '@/components/FilterTabs';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/services/authApi';
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

const FILTERS: FilterOption[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'community', label: 'Comunidade' },
  { key: 'lost_animal', label: 'Perdidos' },
];

function formatTimeAgo(value: string): string {
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `Há ${diffD} d`;
}

function forumPostImageUrl(mediaId: string | null): string | null {
  if (!mediaId) return null;
  return `${getApiBaseUrl()}/api/v1/upload/files/${encodeURIComponent(mediaId)}`;
}

function forumDisplayHandle(
  author: { id: string; name: string | null } | null | undefined,
): string {
  const id = author?.id ?? '';
  const raw = (author?.name || 'Morador').trim();
  const slug = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const suffix = id.replace(/-/g, '').slice(0, 6);
  return slug ? `@${slug}` : `@u_${suffix || '000000'}`;
}

function formatOpinioesLabel(count: number): string {
  if (count === 1) return '1 opinião';
  return `${count} opiniões`;
}

export default function ForumScreen() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ForumPostResponseDto[]>([]);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentSendingPostId, setCommentSendingPostId] = useState<string | null>(null);
  const [commentsExpandedByPost, setCommentsExpandedByPost] = useState<Record<string, boolean>>(
    {},
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const postType = activeFilter === 'todos' ? undefined : activeFilter;
        const rows = await listForumPosts(undefined, {
          postType,
          init: 0,
          end: 20,
        });
        const detailed = await Promise.all(rows.map((r) => getForumPost(r.id)));
        const commentEntries = await Promise.all(
          detailed.map(async (p) => {
            const comments = await listForumComments(p.id, { init: 0, end: 80 });
            return [p.id, comments] as const;
          }),
        );
        setCommentsByPost(Object.fromEntries(commentEntries));
        setItems(detailed);
        setCommentsExpandedByPost({});
      } catch (e) {
        setItems([]);
        setCommentsByPost({});
        setCommentsExpandedByPost({});
        setError(e instanceof Error ? e.message : 'Não foi possível carregar o fórum.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter],
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const onPublish = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      const postType = activeFilter === 'todos' ? 'community' : activeFilter;
      const payload = {
        title: title.trim(),
        content: content.trim(),
        postType,
      } as const;
      await createForumPost(undefined, {
        ...payload,
      });
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
      await load(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }, [activeFilter, content, imageUri, load, title]);

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
  const userName = (user?.name ?? 'A').trim() || 'A';

  const onSendComment = useCallback(async (postId: string) => {
    const text = (commentDraftByPost[postId] ?? '').trim();
    if (!text || !user) return;
    setCommentSendingPostId(postId);
    setError(null);
    try {
      await createForumComment(postId, text);
      setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }));
      setItems((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
        ),
      );
      const comments = await listForumComments(postId, { init: 0, end: 80 });
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a opinião.');
    } finally {
      setCommentSendingPostId(null);
    }
  }, [commentDraftByPost, user]);

  const onLike = useCallback(async (postId: string) => {
    setItems((prev) =>
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
    } catch (e) {
      setItems((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            liked: !p.liked,
            likesCount: Math.max(0, p.likesCount + (p.liked ? -1 : 1)),
          };
        }),
      );
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar o like.');
    }
  }, []);

  const toggleCommentsSection = useCallback((postId: string) => {
    setCommentsExpandedByPost((prev) => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <Text style={styles.subtitle}>
          Opiniões, dúvidas e avisos. Publicações de animais perdidos vindas da central de
          serviços aparecem aqui automaticamente.
        </Text>

        <FilterTabs
          filters={FILTERS}
          active={activeFilter}
          onSelect={(f) => setActiveFilter(f)}
          containerStyle={{ paddingBottom: 4 }}
        />
        <View style={styles.userCard}>
          <Ionicons name="people-outline" size={16} color={AppColors.primary} />
          <Text style={styles.userCardText}>Você participa como {userName}.</Text>
        </View>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.centerText}>Carregando publicações...</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.centerBlock}>
            <Text style={styles.centerText}>Ainda não há publicações nesta aba.</Text>
          </View>
        ) : null}

        {!loading && !error
          ? items.map((post) => {
              const comments = commentsByPost[post.id] ?? [];
              const draft = commentDraftByPost[post.id] ?? '';
              const authorPhoto = post.author?.photoUrl?.trim();
              const displayName = (post.author?.name || 'Morador(a)').trim();
              const initial = displayName.charAt(0).toUpperCase() || 'A';
              const sending = commentSendingPostId === post.id;
              const commentsExpanded = !!commentsExpandedByPost[post.id];

              return (
                <View key={post.id} style={styles.card}>
                  <View style={styles.postTop}>
                    {authorPhoto ? (
                      <Image source={{ uri: authorPhoto }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                      </View>
                    )}
                    <View style={styles.postTopBody}>
                      <View style={styles.nameHandleRow}>
                        <Text style={styles.authorName} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text style={styles.authorHandle} numberOfLines={1}>
                          {forumDisplayHandle(post.author)}
                        </Text>
                      </View>
                      <Text style={styles.timeTextSmall}>{formatTimeAgo(post.createdAt)}</Text>
                      <Text style={styles.title}>{post.title}</Text>
                      <Text style={styles.content}>{post.content}</Text>
                    </View>
                  </View>

                  {post.mediaId ? (
                    <Image
                      source={{ uri: forumPostImageUrl(post.mediaId) ?? '' }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  {post.locationDescription ? (
                    <Text style={styles.locationText}>📍 {post.locationDescription}</Text>
                  ) : null}

                  <View style={styles.footer}>
                    <Pressable
                      onPress={() => void onLike(post.id)}
                      style={({ pressed }) => [styles.likeBtn, pressed && styles.likeBtnPressed]}
                    >
                      <Ionicons
                        name={post.liked ? 'heart' : 'heart-outline'}
                        size={18}
                        color={post.liked ? '#e11d48' : AppColors.text.tertiary}
                      />
                      <Text style={styles.metaText}>{post.likesCount}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => toggleCommentsSection(post.id)}
                      style={({ pressed }) => [
                        styles.footerOpinionsBtn,
                        pressed && styles.footerOpinionsBtnPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: commentsExpanded }}
                      accessibilityLabel={
                        commentsExpanded
                          ? 'Recolher opiniões'
                          : `Ver opiniões, ${formatOpinioesLabel(post.commentsCount)}`
                      }
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color="#0891b2"
                      />
                      <Text style={styles.footerOpinionsLabel}>
                        {formatOpinioesLabel(post.commentsCount)}
                      </Text>
                    </Pressable>
                  </View>

                  {commentsExpanded ? (
                    <View style={styles.commentsSection}>
                      {comments.map((c) => (
                        <View key={c.id} style={styles.commentItem}>
                          <View style={styles.commentAuthorRow}>
                            <Text style={styles.commentAuthorName} numberOfLines={1}>
                              {(c.author?.name || 'Morador(a)').trim()}
                            </Text>
                            <Text style={styles.commentAuthorHandle} numberOfLines={1}>
                              {' '}
                              {forumDisplayHandle(c.author)}
                            </Text>
                          </View>
                          <Text style={styles.commentBody}>{c.content}</Text>
                          <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                        </View>
                      ))}

                      <View style={styles.commentComposer}>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="Deixe sua opinião..."
                          placeholderTextColor={AppColors.text.quaternary}
                          value={draft}
                          onChangeText={(t) =>
                            setCommentDraftByPost((prev) => ({ ...prev, [post.id]: t }))
                          }
                          editable={!!user && !sending}
                        />
                        <Pressable
                          onPress={() => void onSendComment(post.id)}
                          disabled={!user || !draft.trim() || sending}
                          style={({ pressed }) => [
                            styles.commentSendBtn,
                            (!user || !draft.trim() || sending) && styles.commentSendBtnDisabled,
                            pressed && styles.commentSendBtnPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Enviar comentário"
                        >
                          {sending ? (
                            <ActivityIndicator size="small" color={AppColors.text.white} />
                          ) : (
                            <Ionicons name="send" size={18} color={AppColors.text.white} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          : null}
      </ScrollView>

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

      <Modal visible={publishOpen} transparent animationType="fade" onRequestClose={() => setPublishOpen(false)}>
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
            <TextInput
              style={styles.input}
              placeholder="Foto (opcional)"
              editable={false}
              value={imageUri ? 'Imagem selecionada' : ''}
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

      <VisitanteLoginOverlay message="Para participar do fórum, faça login com uma conta cadastrada." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECEFF3' },
  scroll: { paddingTop: 10, paddingBottom: 100 },
  subtitle: {
    marginHorizontal: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: AppColors.text.tertiary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  centerBlock: { paddingVertical: 40, alignItems: 'center', gap: 8 },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600' },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCardText: {
    color: AppColors.text.tertiary,
    fontSize: 16 - 1,
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: { color: AppColors.status.error, fontWeight: '700' },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  postTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  postTopBody: { flex: 1, minWidth: 0 },
  nameHandleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  authorName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  authorHandle: { fontSize: 12, fontWeight: '600', color: '#0e7490' },
  timeTextSmall: { fontSize: 10, color: AppColors.text.quaternary, marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.muted,
  },
  avatarText: { color: AppColors.text.white, fontWeight: '700' },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
    lineHeight: 20,
  },
  content: { fontSize: 14, lineHeight: 22, color: '#475569', marginTop: 4 },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: AppColors.background.muted,
  },
  locationText: { marginTop: 8, color: AppColors.text.tertiary, fontSize: 14 },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerOpinionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  footerOpinionsBtnPressed: { opacity: 0.75 },
  footerOpinionsLabel: { color: '#0891b2', fontWeight: '600', fontSize: 14 },
  metaText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  commentsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 10,
  },
  commentItem: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#cffafe',
    marginBottom: 2,
  },
  commentAuthorRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  commentAuthorName: { fontSize: 12, fontWeight: '800', color: '#1e293b' },
  commentAuthorHandle: { fontSize: 12, fontWeight: '600', color: '#0891b2' },
  commentBody: { fontSize: 14, color: '#475569', marginTop: 4, lineHeight: 20 },
  commentTime: { fontSize: 10, color: AppColors.text.quaternary, marginTop: 4 },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: AppColors.text.secondary,
    backgroundColor: AppColors.background.default,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnDisabled: { opacity: 0.4 },
  commentSendBtnPressed: { opacity: 0.85 },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  likeBtnPressed: {
    opacity: 0.7,
  },
  publishBtn: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
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
  modalTitle: { fontSize: 28 - 4, fontWeight: '900', color: AppColors.text.secondary },
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
