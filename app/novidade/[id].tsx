import FeedPollCard from '@/components/feed/FeedPollCard';
import { formatComentariosLabel, formatTimeAgo } from '@/components/forum/forumUtils';
import { FEED_CATEGORIA_THEME, FEED_TIPO_THEME } from '@/constants/feedNovidadeTheme';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useCanInteractAsCitizen } from '@/hooks/useIsVisitante';
import {
  buildOptimisticNewsComment,
  createNewsComment,
  deleteNewsComment,
  getNewsById,
  isNewsCommentAuthor,
  likeNews,
  likeNewsComment,
  listNewsComments,
  mergeNewsCommentsWithPending,
  newsItemToFeedItem,
  type NewsCommentListItemDto,
} from '@/services/newsApi';
import { createPollVote } from '@/services/pollsApi';
import type { FeedNovidade } from '@/types/feedNovidade';
import { isFeedPollItem } from '@/types/feedNovidade';
import {
  feedPublisherDisplayName,
  isSuperadminPublisherProfile,
} from '@/utils/feedPublisher';
import { isRoleLikeDisplayName } from '@/utils/userDisplayName';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_HEIGHT = 340;
const COMMENT_AVATAR_PLACEHOLDER =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60';

function commentAuthorName(c: NewsCommentListItemDto): string {
  return (c.author?.name || 'Morador(a)').trim();
}

function commentAvatarUri(c: NewsCommentListItemDto): string {
  const url = c.author?.photoUrl?.trim();
  return url && url.length > 0 ? url : COMMENT_AVATAR_PLACEHOLDER;
}

export default function NovidadeDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const newsId = String(params.id ?? '').trim();
  const { name: themeName } = useAppTheme();
  const { user } = useAuth();
  const canInteract = useCanInteractAsCitizen();
  const scrollRef = useRef<ScrollView>(null);
  const commentsSectionY = useRef(0);

  const [item, setItem] = useState<FeedNovidade | null>(null);
  const [comments, setComments] = useState<NewsCommentListItemDto[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newsHostId, setNewsHostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollVoteSending, setPollVoteSending] = useState(false);
  const [pollVoteError, setPollVoteError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!item) return 'Prefeitura';
    if (isFeedPollItem(item)) return feedPublisherDisplayName(item);
    if (item.autorNome && !isRoleLikeDisplayName(item.autorNome)) return item.autorNome;
    const fromAuthor = feedPublisherDisplayName(item);
    if (fromAuthor !== 'Prefeitura') return fromAuthor;
    const themed = themeName?.trim();
    if (themed && themed !== 'Default') {
      return themed.toLowerCase().includes('prefeitura') ? themed : `Prefeitura de ${themed}`;
    }
    return 'Prefeitura';
  }, [item, themeName]);

  const pollIsSuperadmin = useMemo(
    () => (item ? isSuperadminPublisherProfile(item.autorPerfil, item.autorHandle) : false),
    [item],
  );

  const fetchComments = useCallback(
    async (options?: { showLoading?: boolean; expectedCount?: number }) => {
      if (!newsId) return;
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setCommentsLoading(true);
      setCommentsError(null);
      try {
        const rows = await listNewsComments(newsId, {
          init: 0,
          end: 50,
          retryIfEmpty: true,
        });
        setComments((prev) => mergeNewsCommentsWithPending(rows, prev));
        setItem((prev) => (prev ? { ...prev, comentarios: rows.length } : prev));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Não foi possível carregar os comentários.';
        setCommentsError(msg);
      } finally {
        if (showLoading) setCommentsLoading(false);
      }
    },
    [newsId],
  );

  const load = useCallback(async () => {
    if (!newsId) {
      setError('Publicação inválida.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setCommentsLoading(true);
    setError(null);
    setCommentsError(null);
    try {
      const raw = await getNewsById(newsId);
      if (!raw) {
        setError('Comunicado não encontrado ou indisponível.');
        setItem(null);
        setComments([]);
        setNewsHostId(null);
      } else {
        const feedItem = newsItemToFeedItem(raw);
        const hid = raw.hostId ?? feedItem.hostId ?? null;
        setNewsHostId(hid);
        setItem(feedItem);
        if (isFeedPollItem(feedItem)) {
          setComments([]);
          setCommentsLoading(false);
        } else {
          await fetchComments({
            showLoading: true,
            expectedCount: feedItem.comentarios,
          });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o comunicado.');
      setItem(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [newsId, fetchComments]);

  useEffect(() => {
    void load();
  }, [load]);

  const scrollToComments = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, commentsSectionY.current - 12),
      animated: true,
    });
  };

  const onVotePoll = async (optionIndex: number) => {
    if (!item?.poll) return;
    if (!canInteract) {
      promptVisitanteLogin('votar nas enquetes');
      return;
    }
    const pollId = item.pollId ?? item.poll.id;
    setPollVoteSending(true);
    setPollVoteError(null);

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
    setItem({
      ...item,
      poll: {
        ...poll,
        userVoted: true,
        selectedOptionIndex: optionIndex,
        optionCounts: counts,
      },
    });

    try {
      await createPollVote(pollId, optionIndex, item.hostId ?? newsHostId ?? undefined);
      const raw = await getNewsById(newsId);
      if (raw) setItem(newsItemToFeedItem(raw));
    } catch (e) {
      void load();
      const msg = e instanceof Error ? e.message : 'Não foi possível registrar o voto.';
      setPollVoteError(msg);
      Alert.alert('Erro', msg);
    } finally {
      setPollVoteSending(false);
    }
  };

  const onLike = async () => {
    if (!item || isFeedPollItem(item)) return;
    if (!canInteract) {
      promptVisitanteLogin('curtir e comentar comunicados');
      return;
    }
    const wasLiked = !!item.liked;
    setItem({
      ...item,
      liked: !wasLiked,
      curtidas: Math.max(0, item.curtidas + (wasLiked ? -1 : 1)),
    });
    try {
      await likeNews(item.id);
    } catch (e) {
      void load();
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível curtir.');
    }
  };

  const onLikeComment = async (commentId: string) => {
    if (!canInteract) {
      promptVisitanteLogin('curtir e comentar comunicados');
      return;
    }
    const current = comments.find((c) => c.id === commentId);
    if (!current) return;
    const wasLiked = !!current.liked;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              liked: !wasLiked,
              likesCount: Math.max(0, c.likesCount + (wasLiked ? -1 : 1)),
            }
          : c,
      ),
    );
    try {
      await likeNewsComment(commentId);
    } catch (e) {
      void fetchComments({ showLoading: false });
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível curtir o comentário.');
    }
  };

  const onSendComment = async () => {
    if (!item) return;
    if (!canInteract) {
      promptVisitanteLogin('curtir e comentar comunicados');
      return;
    }
    if (!user?.id) return;
    const text = commentDraft.trim();
    if (!text) return;

    const optimistic = buildOptimisticNewsComment(text, {
      id: user.id,
      name: user.name,
      photoUrl: user.photoUrl,
    });
    const prevCount = item.comentarios;

    setCommentSending(true);
    setCommentDraft('');
    setComments((prev) => [...prev, optimistic]);
    setItem((prev) => (prev ? { ...prev, comentarios: prev.comentarios + 1 } : prev));

    try {
      await createNewsComment(item.id, text, item.hostId ?? newsHostId);
      await fetchComments({ showLoading: false });
      scrollToComments();
    } catch (e) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setItem((prev) => (prev ? { ...prev, comentarios: prevCount } : prev));
      setCommentDraft(text);
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível enviar o comentário.');
    } finally {
      setCommentSending(false);
    }
  };

  const onDeleteComment = (comment: NewsCommentListItemDto) => {
    if (!isNewsCommentAuthor(comment)) return;
    Alert.alert('Excluir comentário', 'Deseja remover este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteNewsComment(comment.id);
              setComments((prev) => prev.filter((c) => c.id !== comment.id));
              setItem((prev) =>
                prev ? { ...prev, comentarios: Math.max(0, prev.comentarios - 1) } : prev,
              );
            } catch (e) {
              Alert.alert(
                'Erro',
                e instanceof Error ? e.message : 'Não foi possível excluir o comentário.',
              );
            }
          })();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.centerText}>Carregando publicação…</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={44} color={AppColors.text.quaternary} />
        <Text style={styles.errorText}>{error ?? 'Comunicado indisponível.'}</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const isPoll = isFeedPollItem(item);
  const catTheme = FEED_CATEGORIA_THEME[item.categoria];
  const tipoTheme = FEED_TIPO_THEME[item.tipoNovidade];
  const commentCount = Math.max(item.comentarios, comments.length);

  if (isPoll) {
    return (
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={['#5b21b6', '#7c3aed', '#a78bfa']}
              style={styles.heroImage}
            >
              <Ionicons name="stats-chart" size={56} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
            <LinearGradient
              colors={['rgba(0,0,0,0.45)', 'transparent']}
              style={styles.heroGradientTop}
            />
            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <Pressable
                style={styles.heroIconBtn}
                onPress={() => router.back()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.heroBadges}>
              <View style={[styles.heroBadge, { backgroundColor: '#ede9fe' }]}>
                <Text style={[styles.heroBadgeText, { color: '#7c3aed' }]}>ENQUETE</Text>
              </View>
            </View>
          </View>

          <View style={styles.contentPanel}>
            <Text style={styles.title}>{item.titulo}</Text>
            <View style={styles.authorRow}>
              <Image source={{ uri: item.autorAvatar }} style={styles.authorAvatar} />
              <View style={styles.authorText}>
                <View style={styles.pollAuthorNameRow}>
                  <Text style={styles.authorName}>{displayName}</Text>
                  {pollIsSuperadmin ? (
                    <View style={styles.pollRoleBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#1d4ed8" />
                      <Text style={styles.pollRoleBadgeText}>Superadmin</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={14} color="#64748b" />
                  <Text style={styles.dateText}>
                    {item.dataFormatada}
                    {item.dataRelativa ? ` · ${item.dataRelativa}` : ''}
                  </Text>
                </View>
              </View>
            </View>
            {item.conteudo ? <Text style={styles.body}>{item.conteudo}</Text> : null}
            <FeedPollCard
              item={item}
              canInteract={canInteract}
              voteSubmitting={pollVoteSending}
              voteError={pollVoteError}
              embedded
              showMuralLink={false}
              onVote={(index) => void onVotePoll(index)}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroWrap}>
          {item.imagem ? (
            <Image source={{ uri: item.imagem }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={['#1e40af', '#2563eb', '#0891b2']}
              style={styles.heroImage}
            >
              <Ionicons name={tipoTheme.icon} size={56} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent']}
            style={styles.heroGradientTop}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)']}
            style={styles.heroGradientBottom}
          />

          <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
            <Pressable
              style={styles.heroIconBtn}
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.heroBadges}>
            <View style={[styles.heroBadge, { backgroundColor: tipoTheme.bg }]}>
              <Ionicons name={tipoTheme.icon} size={12} color={tipoTheme.color} />
              <Text style={[styles.heroBadgeText, { color: tipoTheme.color }]}>
                {item.tipoLabel.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: catTheme.bg }]}>
              <Text style={[styles.heroBadgeText, { color: catTheme.color }]}>
                {catTheme.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contentPanel}>
          <Text style={styles.title}>{item.titulo}</Text>

          <View style={styles.officialBanner}>
            <Ionicons name="shield-checkmark" size={16} color="#1d4ed8" />
            <Text style={styles.officialBannerText}>Publicação oficial da Prefeitura</Text>
          </View>

          <View style={styles.authorRow}>
            <Image source={{ uri: item.autorAvatar }} style={styles.authorAvatar} />
            <View style={styles.authorText}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{displayName}</Text>
                {item.isOfficial ? (
                  <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" />
                ) : null}
              </View>
              {item.isOfficial && (item.officialRole || item.officialInstitution) ? (
                <Text style={styles.officialRoleText} numberOfLines={1}>
                  {[item.officialRole, item.officialInstitution].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.dateText}>
                  {item.dataFormatada}
                  {item.dataRelativa ? ` · ${item.dataRelativa}` : ''}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.body}>{item.conteudo}</Text>

          <View style={styles.statsRow}>
            <Pressable
              style={styles.statBtn}
              onPress={() => void onLike()}
              disabled={!canInteract}
            >
              <Ionicons
                name={item.liked ? 'heart' : 'heart-outline'}
                size={22}
                color={item.liked ? '#e11d48' : '#64748b'}
              />
              <Text style={[styles.statText, item.liked && styles.statTextLiked]}>
                {item.curtidas} {item.curtidas === 1 ? 'curtida' : 'curtidas'}
              </Text>
            </Pressable>
            <Pressable style={styles.statBtn} onPress={scrollToComments}>
              <Ionicons name="chatbubble-outline" size={22} color="#0891b2" />
              <Text style={styles.statTextComments}>{formatComentariosLabel(commentCount)}</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={styles.commentsSection}
          onLayout={(e) => {
            commentsSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.commentsTitle}>Comentários ({commentCount})</Text>

          {commentsLoading ? (
            <ActivityIndicator size="small" color={AppColors.primary} style={styles.commentsLoader} />
          ) : comments.length === 0 && commentCount === 0 ? (
            <Text style={styles.commentsEmpty}>
              Seja o primeiro a comentar este comunicado.
            </Text>
          ) : comments.length === 0 ? (
            <View style={styles.commentsEmptyBox}>
              <Text style={styles.commentsEmpty}>
                {commentsError ??
                  'Os comentários existem no servidor, mas ainda não carregaram. Tente novamente.'}
              </Text>
              <Pressable
                style={styles.commentsRetryBtn}
                onPress={() => void fetchComments()}
              >
                <Text style={styles.commentsRetryText}>Recarregar comentários</Text>
              </Pressable>
            </View>
          ) : (
            comments.map((c) => {
              const authorName = commentAuthorName(c);
              const openCommentAuthor = () => {
                const userId = c.author?.id?.trim() || c.userId?.trim();
                if (!userId) return;
                router.push({
                  pathname: '/forum/author',
                  params: {
                    userId,
                    name: authorName,
                    photoUrl: c.author?.photoUrl ?? '',
                  },
                });
              };
              return (
              <View key={c.id} style={styles.commentItem}>
                <Pressable
                  onPress={openCommentAuthor}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver perfil de ${authorName}`}
                >
                  <Image source={{ uri: commentAvatarUri(c) }} style={styles.commentAvatar} />
                </Pressable>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Pressable
                      onPress={openCommentAuthor}
                      style={styles.commentAuthorBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver perfil de ${authorName}`}
                    >
                      <Text style={styles.commentAuthor} numberOfLines={1}>
                        {authorName}
                      </Text>
                    </Pressable>
                    <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                    {isNewsCommentAuthor(c) ? (
                      <Pressable
                        onPress={() => onDeleteComment(c)}
                        hitSlop={8}
                        accessibilityLabel="Excluir comentário"
                      >
                        <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.commentText}>{c.content}</Text>
                  <Pressable
                    style={styles.commentLikeBtn}
                    onPress={() => void onLikeComment(c.id)}
                    disabled={!canInteract}
                  >
                    <Ionicons
                      name={c.liked ? 'heart' : 'heart-outline'}
                      size={16}
                      color={c.liked ? '#e11d48' : '#94a3b8'}
                    />
                    {c.likesCount > 0 ? (
                      <Text style={[styles.commentLikeCount, c.liked && styles.statTextLiked]}>
                        {c.likesCount}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.composerInput}
          placeholder="Escreva um comentário..."
          placeholderTextColor={AppColors.text.quaternary}
          value={commentDraft}
          onChangeText={setCommentDraft}
          editable={canInteract && !commentSending}
          multiline
          maxLength={10000}
        />
        <Pressable
          onPress={() => void onSendComment()}
          disabled={!canInteract || !commentDraft.trim() || commentSending}
          style={({ pressed }) => [
            styles.composerSend,
            (!canInteract || !commentDraft.trim() || commentSending) && styles.composerSendDisabled,
            pressed && styles.composerSendPressed,
          ]}
        >
          {commentSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  centerText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  backLink: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backLinkText: {
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  heroWrap: {
    height: HERO_HEIGHT,
    backgroundColor: '#e2e8f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadges: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  contentPanel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 34,
  },
  officialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  officialBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
  },
  authorText: {
    flex: 1,
    gap: 4,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  authorName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  officialRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  pollAuthorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pollRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pollRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  statBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  statTextComments: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0891b2',
  },
  statTextLiked: {
    color: '#e11d48',
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#334155',
  },
  commentsSection: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 8,
    borderTopColor: '#f1f5f9',
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  commentsLoader: {
    marginVertical: 12,
  },
  commentsEmptyBox: {
    gap: 10,
  },
  commentsEmpty: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  commentsRetryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  commentsRetryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthorBtn: {
    flex: 1,
    minWidth: 0,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  commentTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  commentLikeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  composerSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSendDisabled: {
    opacity: 0.45,
  },
  composerSendPressed: {
    opacity: 0.85,
  },

});
