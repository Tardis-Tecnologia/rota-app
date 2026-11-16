import FeedMedia, { isVideoMedia } from '@/components/feed/FeedMedia';
import {
  forumDisplayHandle,
  forumPostMediaUri,
  profileLabel,
  withListImageCacheBust,
} from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById, type UserSummary } from '@/services/authApi';
import {
  deleteForumPost,
  createForumComment,
  likeForumPost,
  listAuthorForumPosts,
  listForumComments,
  listForumLikes,
  type ForumLikeListItemDto,
  type ForumPostCommentListItemDto,
  type ForumPostResponseDto,
} from '@/services/forumApi';
import { findOrCreateDirectStreamChannel } from '@/services/streamChatApi';
import { personDisplayName, streamAndUiDisplayName } from '@/utils/userDisplayName';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForumAuthorScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    userId?: string;
    name?: string;
    photoUrl?: string;
  }>();

  const userId = String(params.userId ?? '').trim();
  const isSelf = !!user?.id && userId === user.id;
  const isVisitante = user?.profile === 'VISITANTE';

  const [loading, setLoading] = useState(!!userId);
  const [profile, setProfile] = useState<UserSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPostResponseDto[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPostResponseDto | null>(null);
  const [likers, setLikers] = useState<ForumLikeListItemDto[]>([]);
  const [postComments, setPostComments] = useState<ForumPostCommentListItemDto[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const imageEpoch = useMemo(() => Date.now(), []);
  const { height: windowHeight } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const gridGap = 2;
  const cellSize = gridWidth > 0 ? Math.floor((gridWidth - gridGap * 2) / 3) : 0;
  const viewerMediaHeight = Math.min(Math.round(windowHeight * 0.56), 520);

  const fallbackName = personDisplayName(params.name, 'Morador(a)');
  const displayName = personDisplayName(profile?.name ?? fallbackName, 'Morador(a)');
  const photoRaw = profile?.photoUrl?.trim() || params.photoUrl?.trim() || '';
  const photoUri = photoRaw ? withListImageCacheBust(photoRaw, imageEpoch) : null;
  const initial = displayName.charAt(0).toUpperCase() || 'M';
  const handle = forumDisplayHandle({ id: userId, name: displayName });
  const badge = profileLabel(profile?.profile);

  useEffect(() => {
    if (!userId) {
      setError('Perfil inválido.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserById(userId);
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) {
          setProfile(null);
          setError(e instanceof Error ? e.message : 'Não foi possível carregar o perfil.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadPosts = useCallback(async () => {
    if (!userId) return;
    setPostsLoading(true);
    setPostsError(null);
    try {
      const rows = await listAuthorForumPosts(userId, { init: 0, end: 60 });
      setPosts(rows);
    } catch (e) {
      setPostsError(e instanceof Error ? e.message : 'Não foi possível carregar o feed.');
    } finally {
      setPostsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  useEffect(() => {
    if (!selectedPost) {
      setLikers([]);
      setPostComments([]);
      setShowLikers(false);
      setShowComments(false);
      setCommentDraft('');
      return;
    }
    let cancelled = false;
    setPeopleLoading(true);
    setShowLikers(false);
    setShowComments(false);
    setCommentDraft('');
    void Promise.all([
      listForumLikes(selectedPost.id, { init: 0, end: 100 }),
      listForumComments(selectedPost.id, { init: 0, end: 50 }),
    ])
      .then(([likeRows, commentRows]) => {
        if (cancelled) return;
        setLikers(likeRows);
        setPostComments(commentRows);
        setSelectedPost((current) =>
          current && current.id === selectedPost.id
            ? {
                ...current,
                likesCount: likeRows.length,
                commentsCount: commentRows.length,
              }
            : current,
        );
        setPosts((prev) =>
          prev.map((post) =>
            post.id === selectedPost.id
              ? {
                  ...post,
                  likesCount: likeRows.length,
                  commentsCount: commentRows.length,
                }
              : post,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLikers([]);
          setPostComments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setPeopleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPost?.id]);

  const applyCommentRows = useCallback((postId: string, commentRows: ForumPostCommentListItemDto[]) => {
    setPostComments(commentRows);
    setSelectedPost((current) =>
      current && current.id === postId
        ? { ...current, commentsCount: commentRows.length }
        : current,
    );
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, commentsCount: commentRows.length } : post,
      ),
    );
  }, []);

  const sendComment = useCallback(async () => {
    if (!selectedPost || !user || isVisitante || commentSending) return;
    const text = commentDraft.trim();
    if (!text) return;
    const postId = selectedPost.id;
    setCommentSending(true);
    try {
      await createForumComment(postId, text);
      setCommentDraft('');
      const commentRows = await listForumComments(postId, { init: 0, end: 50 });
      applyCommentRows(postId, commentRows);
    } catch (e) {
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível comentar.',
      );
    } finally {
      setCommentSending(false);
    }
  }, [applyCommentRows, commentDraft, commentSending, isVisitante, selectedPost, user]);

  const openPerson = useCallback(
    (personId: string, name: string, photoUrl?: string | null) => {
      const id = personId.trim();
      if (!id) return;
      setSelectedPost(null);
      if (id === userId) return;
      router.push({
        pathname: '/forum/author',
        params: { userId: id, name, photoUrl: photoUrl ?? '' },
      });
    },
    [userId],
  );

  const confirmDeleteSelected = useCallback(() => {
    if (!selectedPost || deletingPost) return;
    const postId = selectedPost.id;
    Alert.alert('Excluir publicação', 'Esta publicação sai do seu feed.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeletingPost(true);
            try {
              await deleteForumPost(postId);
              setPosts((prev) => prev.filter((post) => post.id !== postId));
              setSelectedPost(null);
            } catch (e) {
              Alert.alert(
                'Erro',
                e instanceof Error ? e.message : 'Não foi possível excluir a publicação.',
              );
            } finally {
              setDeletingPost(false);
            }
          })();
        },
      },
    ]);
  }, [deletingPost, selectedPost]);

  const toggleSelectedLike = useCallback(async () => {
    if (!selectedPost || !user || isVisitante) return;
    const wasLiked = !!selectedPost.liked;
    const next = {
      ...selectedPost,
      liked: !wasLiked,
      likesCount: Math.max(0, selectedPost.likesCount + (wasLiked ? -1 : 1)),
    };
    setSelectedPost(next);
    setPosts((prev) => prev.map((post) => (post.id === next.id ? next : post)));
    try {
      await likeForumPost(selectedPost.id);
    } catch {
      void loadPosts();
    }
  }, [isVisitante, loadPosts, selectedPost, user]);

  const startChat = useCallback(async () => {
    if (!user?.id || !userId || isSelf || isVisitante) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const channel = await findOrCreateDirectStreamChannel({
        currentUserId: user.id,
        currentUserDisplayName: streamAndUiDisplayName(user) ?? user.name ?? 'Usuário',
        peerUserId: userId,
        peerName: displayName,
        peerImage: photoRaw || undefined,
      });
      router.push({
        pathname: '/ChatTab',
        params: {
          provider: JSON.stringify({
            id: userId,
            name: displayName,
            image: photoRaw || undefined,
            channelType: channel.channelType,
            channelId: channel.channelId,
            cid: channel.cid,
          }),
        },
      });
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Não foi possível iniciar a conversa.');
    } finally {
      setChatLoading(false);
    }
  }, [displayName, isSelf, isVisitante, photoRaw, user, userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.centerText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={40} color={AppColors.text.quaternary} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>
            {profile?.official ? (
              <Ionicons name="checkmark-circle" size={18} color="#1D9BF0" />
            ) : null}
          </View>
          <Text style={styles.handle}>{handle}</Text>
          <Text style={styles.subtitle}>
            {profile?.official
              ? `${profile.official.roleTitle} · ${profile.official.institution}`
              : 'Participante do feed da cidade'}
          </Text>
          {profile?.bio?.trim() ? (
            <Text style={styles.bio}>{profile.bio.trim()}</Text>
          ) : isSelf && !isVisitante ? (
            <Pressable onPress={() => router.push('/edit-account')}>
              <Text style={styles.bioEmpty}>Adicione uma bio em Conta</Text>
            </Pressable>
          ) : null}

          {badge ? (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#0e7490" />
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}

          {profile?.uf?.trim() ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={AppColors.text.tertiary} />
              <Text style={styles.metaText}>UF: {profile.uf.trim()}</Text>
            </View>
          ) : null}

          {isSelf ? (
            <View style={styles.selfHint}>
              <Ionicons name="information-circle-outline" size={18} color="#64748b" />
              <Text style={styles.selfHintText}>Este é o seu perfil.</Text>
            </View>
          ) : null}
        </View>

        {!isSelf && user && !isVisitante ? (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Conversar</Text>
            <Text style={styles.actionsHint}>
              Envie uma mensagem privada. A conversa aparece em Mensagens.
            </Text>

            {chatError ? (
              <View style={styles.chatErrorBox}>
                <Text style={styles.chatErrorText}>{chatError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void startChat()}
              disabled={chatLoading}
              style={({ pressed }) => [pressed && !chatLoading && styles.chatBtnPressed]}
            >
              <LinearGradient
                colors={['#0e7490', '#0891b2', '#14b8a6']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.chatGradient}
              >
                {chatLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                    <Text style={styles.chatBtnText}>Iniciar conversa</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}

        {isVisitante && !isSelf ? (
          <Text style={styles.loginHint}>Faça login para enviar mensagens a este morador.</Text>
        ) : null}

        <View style={styles.feedCard}>
          <Text style={styles.feedTitle}>{isSelf ? 'Meu feed' : 'Feed'}</Text>
          <Text style={styles.feedHint}>
            {posts.length === 1 ? '1 publicação' : `${posts.length} publicações`}
          </Text>
          {postsLoading && posts.length === 0 ? (
            <ActivityIndicator color={AppColors.primary} style={styles.feedLoader} />
          ) : null}
          {postsError ? <Text style={styles.feedError}>{postsError}</Text> : null}
          {!postsLoading && !postsError && posts.length === 0 ? (
            <Text style={styles.feedEmpty}>Nenhuma publicação ainda.</Text>
          ) : null}
          <View
            style={styles.grid}
            onLayout={(event) => {
              const next = Math.floor(event.nativeEvent.layout.width);
              setGridWidth((current) => (current === next ? current : next));
            }}
          >
            {cellSize > 0
              ? posts.map((post) => {
                  const mediaUri = forumPostMediaUri(post);
                  const caption = (post.content || post.title || '').trim();
                  return (
                    <Pressable
                      key={post.id}
                      style={[styles.cell, { width: cellSize, height: cellSize }]}
                      onPress={() => setSelectedPost(post)}
                      accessibilityRole="button"
                      accessibilityLabel={caption || 'Abrir publicação'}
                    >
                      {mediaUri ? (
                        <Image
                          source={{ uri: mediaUri }}
                          style={styles.cellImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.cellText}>
                          <Text style={styles.cellCaption} numberOfLines={4}>
                            {caption || 'Publicação'}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              : null}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedPost}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPost(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.viewerRoot}
        >
          <Pressable style={styles.viewerBackdrop} onPress={() => setSelectedPost(null)} />
          {selectedPost ? (
            <View style={[styles.viewerCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={styles.viewerHeader}>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {selectedPost.title?.trim() || 'Publicação'}
                </Text>
                <Pressable
                  onPress={() => setSelectedPost(null)}
                  hitSlop={10}
                  accessibilityLabel="Fechar publicação"
                >
                  <Ionicons name="close" size={22} color="#64748b" />
                </Pressable>
              </View>
              <ScrollView
                style={styles.viewerScroll}
                contentContainerStyle={styles.viewerScrollContent}
                showsVerticalScrollIndicator={false}
              >
              {(() => {
                const mediaUri = forumPostMediaUri(selectedPost);
                if (!mediaUri) return null;
                return (
                  <View style={[styles.viewerStage, { height: viewerMediaHeight }]}>
                    {isVideoMedia(mediaUri, selectedPost.mediaContentType) ? (
                      <FeedMedia
                        uri={mediaUri}
                        contentType={selectedPost.mediaContentType}
                        aspectRatio={1}
                        style={styles.viewerMedia}
                      />
                    ) : (
                      <Image
                        source={{ uri: mediaUri }}
                        style={styles.viewerMedia}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                );
              })()}
              {selectedPost.content?.trim() ? (
                <Text style={styles.viewerBody}>{selectedPost.content.trim()}</Text>
              ) : null}
              <View style={styles.viewerActions}>
                <Pressable
                  style={styles.viewerLike}
                  onPress={() => void toggleSelectedLike()}
                  disabled={!user || isVisitante}
                  accessibilityLabel={selectedPost.liked ? 'Descurtir' : 'Curtir'}
                >
                  <Ionicons
                    name={selectedPost.liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={selectedPost.liked ? '#e11d48' : '#0f172a'}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setShowLikers((open) => !open)}
                  accessibilityRole="button"
                  accessibilityLabel="Ver quem curtiu"
                >
                  <Text style={styles.viewerLikeText}>
                    {selectedPost.likesCount === 1
                      ? '1 curtida'
                      : `${selectedPost.likesCount} curtidas`}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.viewerCommentsBtn}
                  onPress={() => setShowComments((open) => !open)}
                  accessibilityRole="button"
                  accessibilityLabel="Ver quem comentou"
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#0f172a" />
                  <Text style={styles.viewerLikeText}>
                    {selectedPost.commentsCount === 1
                      ? '1 comentário'
                      : `${selectedPost.commentsCount} comentários`}
                  </Text>
                </Pressable>
              </View>
              {peopleLoading && (showLikers || showComments) ? (
                <ActivityIndicator color={AppColors.primary} />
              ) : null}
              {showLikers ? (
                <View style={styles.peopleBox}>
                  <Text style={styles.peopleTitle}>Curtidas</Text>
                  {likers.length === 0 ? (
                    <Text style={styles.peopleEmpty}>Nenhuma curtida ainda.</Text>
                  ) : (
                    likers.map((person) => {
                      const name = personDisplayName(person.name, 'Morador(a)');
                      return (
                        <Pressable
                          key={person.userId}
                          style={styles.personRow}
                          onPress={() => openPerson(person.userId, name, person.photoUrl)}
                        >
                          {person.photoUrl ? (
                            <Image source={{ uri: person.photoUrl }} style={styles.personAvatar} />
                          ) : (
                            <View style={styles.personAvatar}>
                              <Text style={styles.personInitial}>{name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={styles.personName} numberOfLines={1}>{name}</Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              ) : null}
              {showComments ? (
                <View style={styles.peopleBox}>
                  <Text style={styles.peopleTitle}>Comentários</Text>
                  {postComments.length === 0 ? (
                    <Text style={styles.peopleEmpty}>Nenhum comentário ainda.</Text>
                  ) : (
                    postComments.map((comment) => {
                      const authorId = comment.author?.id?.trim() || comment.userId?.trim() || '';
                      const name = personDisplayName(comment.author?.name, 'Morador(a)');
                      const photo = comment.author?.photoUrl?.trim();
                      return (
                        <View key={comment.id} style={styles.commentBlock}>
                          <Pressable
                            style={styles.personRow}
                            disabled={!authorId}
                            onPress={() => openPerson(authorId, name, photo)}
                          >
                            {photo ? (
                              <Image source={{ uri: photo }} style={styles.personAvatar} />
                            ) : (
                              <View style={styles.personAvatar}>
                                <Text style={styles.personInitial}>{name.charAt(0).toUpperCase()}</Text>
                              </View>
                            )}
                            <Text style={styles.personName} numberOfLines={1}>{name}</Text>
                          </Pressable>
                          <Text style={styles.commentText}>{comment.content}</Text>
                        </View>
                      );
                    })
                  )}
                  {user && !isVisitante ? (
                    <View style={styles.composer}>
                      <TextInput
                        style={styles.composerInput}
                        placeholder="Escreva um comentário..."
                        placeholderTextColor="#94a3b8"
                        value={commentDraft}
                        onChangeText={setCommentDraft}
                        editable={!commentSending}
                        multiline
                        maxLength={500}
                      />
                      <Pressable
                        style={[
                          styles.composerSend,
                          (!commentDraft.trim() || commentSending) && styles.composerSendDisabled,
                        ]}
                        onPress={() => void sendComment()}
                        disabled={!commentDraft.trim() || commentSending}
                        accessibilityLabel="Enviar comentário"
                      >
                        {commentSending ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Ionicons name="send" size={16} color="#fff" />
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.peopleEmpty}>Faça login para comentar.</Text>
                  )}
                </View>
              ) : null}
              {user?.id && selectedPost.userId === user.id ? (
                <Pressable
                  style={styles.deleteBtn}
                  onPress={confirmDeleteSelected}
                  disabled={deletingPost}
                >
                  {deletingPost ? (
                    <ActivityIndicator color="#dc2626" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      <Text style={styles.deleteBtnText}>Excluir publicação</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
              </ScrollView>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECEFF3' },
  scroll: { padding: 16, gap: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
    backgroundColor: '#ECEFF3',
  },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600' },
  errorText: {
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 6,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#0891b2',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  name: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  handle: { fontSize: 14, fontWeight: '700', color: '#0e7490' },
  subtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  bio: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '500',
  },
  bioEmpty: {
    marginTop: 8,
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '700',
  },
  feedCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    overflow: 'hidden',
  },
  feedTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', paddingHorizontal: 14 },
  feedHint: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    paddingHorizontal: 14,
  },
  feedLoader: { marginVertical: 16 },
  feedError: {
    color: AppColors.status.error,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  feedEmpty: {
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    paddingHorizontal: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, width: '100%' },
  cell: { overflow: 'hidden', backgroundColor: '#e2e8f0' },
  cellImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cellText: { flex: 1, padding: 8, justifyContent: 'center', backgroundColor: '#f8fafc' },
  cellCaption: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: '#334155' },
  viewerRoot: { flex: 1, justifyContent: 'flex-end' },
  viewerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  viewerCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '88%',
  },
  viewerScroll: { flexGrow: 0 },
  viewerScrollContent: { gap: 12, paddingBottom: 8 },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viewerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0f172a' },
  viewerStage: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerMedia: { width: '100%', height: '100%' },
  viewerBody: { fontSize: 15, lineHeight: 22, color: '#334155' },
  viewerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  viewerLike: { paddingVertical: 4 },
  viewerCommentsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  viewerLikeText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  peopleBox: { gap: 10, paddingTop: 4 },
  peopleTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  peopleEmpty: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: { fontSize: 14, fontWeight: '800', color: '#334155' },
  personName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0f172a' },
  commentBlock: { gap: 4 },
  commentText: { marginLeft: 46, fontSize: 14, lineHeight: 20, color: '#334155' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  composerSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
  },
  composerSendDisabled: { opacity: 0.45 },
  deleteBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  deleteBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 15 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecfeff',
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#0e7490' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: { fontSize: 13, color: AppColors.text.tertiary, fontWeight: '600' },
  selfHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  selfHintText: { fontSize: 13, color: AppColors.text.tertiary, fontWeight: '600' },
  actionsCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 10,
  },
  actionsTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  actionsHint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
    fontWeight: '500',
  },
  chatErrorBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  chatErrorText: { color: AppColors.status.error, fontWeight: '700', fontSize: 13 },
  chatBtnPressed: { opacity: 0.92 },
  chatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  chatBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  loginHint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});
