import LostAnimalImageLightbox from '@/components/animals/LostAnimalImageLightbox';
import FeedLikesSheet, { type FeedLiker } from '@/components/feed/FeedLikesSheet';
import FeedMedia, { isVideoMedia } from '@/components/feed/FeedMedia';
import { formatComentariosLabel, formatTimeAgo } from '@/components/forum/forumUtils';
import ForumPostOverflowMenu, {
  type ForumPostOverflowAnchor,
} from '@/components/forum/ForumPostOverflowMenu';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useForumModeration } from '@/contexts/ForumModerationContext';
import {
  deleteForumPost,
  listForumLikes,
  type ForumPostCommentListItemDto,
  type ForumPostResponseDto,
} from '@/services/forumApi';
import { confirmAndSubmitForumReport } from '@/utils/forumReportFlow';
import { personDisplayName } from '@/utils/userDisplayName';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  forumDisplayHandle,
  forumPostMediaUri,
  isForumPostOwnedByUser,
  isPartnerStoreForumPost,
  openForumAuthorProfile,
  openForumCommercialStoreProfile,
  withListImageCacheBust,
} from './forumUtils';

interface ForumPostCardProps {
  post: ForumPostResponseDto;
  comments: ForumPostCommentListItemDto[];
  imageCacheEpoch: number;
  commentDraft: string;
  commentsExpanded: boolean;
  commentSending: boolean;
  canInteract: boolean;
  channelName?: string;
  onLike: () => void;
  onOpenLikes?: () => void;
  onToggleComments: () => void;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
  onOpenStore?: () => void;
  onDelete?: () => void;
  onRemoved?: () => void;
  onReportPost?: () => void;
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
}

function buildPostBody(title: string, content: string): string {
  const t = title.replace(/\s+/g, ' ').trim();
  const c = content.replace(/\s+/g, ' ').trim();
  if (!t || !c || t === c || c.startsWith(t)) return c || t || '';
  const sep = /[.!?…]$/.test(t) ? ' ' : '. ';
  return `${t}${sep}${c}`;
}

export default function ForumPostCard({
  post,
  comments,
  imageCacheEpoch,
  commentDraft,
  commentsExpanded,
  commentSending,
  canInteract,
  channelName,
  onLike,
  onOpenLikes,
  onToggleComments,
  onCommentDraftChange,
  onSendComment,
  onOpenStore,
  onDelete,
  onRemoved,
  onReportPost,
  style,
  showDivider = true,
}: ForumPostCardProps) {
  const { user } = useAuth();
  const { canComment: canCommentForum, requestForumComment } = useForumModeration();
  const menuBtnRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<ForumPostOverflowAnchor | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likers, setLikers] = useState<FeedLiker[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const isStorePost = isPartnerStoreForumPost(post);
  const storeAuthor = post.authorCommercial;
  const authorPhotoRaw = isStorePost
    ? storeAuthor?.photoUrl?.trim()
    : post.author?.photoUrl?.trim();
  const authorPhoto = authorPhotoRaw
    ? withListImageCacheBust(authorPhotoRaw, imageCacheEpoch)
    : '';
  const postImageRaw = forumPostMediaUri(post);
  const postImageUri = postImageRaw
    ? withListImageCacheBust(postImageRaw, imageCacheEpoch)
    : null;
  const postIsVideo = isVideoMedia(postImageUri, post.mediaContentType);
  const displayName = isStorePost
    ? (storeAuthor?.storeName || 'Loja parceira').trim()
    : personDisplayName(post.author?.name, 'Morador(a)');
  const initial = displayName.charAt(0).toUpperCase() || 'A';
  const coupon = post.promotedCoupon;
  const bodyText = useMemo(
    () => buildPostBody(post.title, post.content),
    [post.title, post.content],
  );
  const handleLabel = useMemo(
    () => (isStorePost ? 'Comércio local' : forumDisplayHandle(post.author)),
    [isStorePost, post.author],
  );
  const timeLabel = useMemo(() => formatTimeAgo(post.createdAt), [post.createdAt]);
  const locationLabel = post.locationDescription?.trim() || '';

  const openAuthor = useCallback((author: typeof post.author) => {
    openForumAuthorProfile(author, router);
  }, []);

  const handleOpenLikes = useCallback(() => {
    if (onOpenLikes) {
      onOpenLikes();
      return;
    }
    setLikesOpen(true);
    setLikesLoading(true);
    void listForumLikes(post.id, { init: 0, end: 100 })
      .then((rows) => setLikers(rows))
      .catch(() => setLikers([]))
      .finally(() => setLikesLoading(false));
  }, [onOpenLikes, post.id]);

  const openStoreHeader = useCallback(() => {
    if (onOpenStore) {
      onOpenStore();
      return;
    }
    if (isStorePost) {
      openForumCommercialStoreProfile(post, router);
    }
  }, [isStorePost, onOpenStore, post]);

  const canOpenStoreProfile = isStorePost && (!!onOpenStore || !!post.authorCommercial?.id);
  const canViewProfile = isStorePost ? canOpenStoreProfile : !!post.author?.id;
  const isOwnPost = isForumPostOwnedByUser(post, user?.id);
  const canReportPost = canInteract && !isOwnPost;
  const canComposeComment = canInteract && canCommentForum;

  const openOverflowMenu = useCallback(() => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ top: y + height, left: x, width });
      setMenuOpen(true);
    });
  }, []);

  const closeOverflowMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleViewProfile = useCallback(() => {
    if (isStorePost) {
      openStoreHeader();
      return;
    }
    openAuthor(post.author);
  }, [isStorePost, openAuthor, openStoreHeader, post.author]);

  const confirmDeletePost = useCallback(() => {
    Alert.alert('Excluir publicação', 'Esta publicação será removida do feed.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteForumPost(post.id);
              onRemoved?.();
            } catch (e) {
              Alert.alert(
                'Erro',
                e instanceof Error ? e.message : 'Não foi possível excluir a publicação.',
              );
            }
          })();
        },
      },
    ]);
  }, [onRemoved, post.id]);

  const handleReportPost = useCallback(() => {
    if (!canInteract) {
      promptVisitanteLogin('denunciar publicações no feed');
      return;
    }
    if (onReportPost) {
      onReportPost();
      return;
    }
    confirmAndSubmitForumReport('FORUM_POST', post.id, { canInteract: true });
  }, [canInteract, onReportPost, post.id]);

  const handleReportComment = useCallback(
    (comment: ForumPostCommentListItemDto) => {
      if (!canInteract) {
        promptVisitanteLogin('denunciar comentários no feed');
        return;
      }
      confirmAndSubmitForumReport('FORUM_COMMENT', comment.id, { canInteract: true });
    },
    [canInteract],
  );

  const avatarNode = authorPhoto ? (
    <Image source={{ uri: authorPhoto }} style={styles.avatarImage} />
  ) : (
    <View style={[styles.avatar, isStorePost && styles.avatarStore]}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );

  return (
    <View style={[styles.card, showDivider && styles.cardDivider, style]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (isStorePost ? openStoreHeader() : openAuthor(post.author))}
          disabled={isStorePost ? !canOpenStoreProfile : !post.author?.id}
          style={styles.headerLeft}
        >
          {avatarNode}
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {displayName}
              </Text>
              {isStorePost ? (
                <View style={styles.badgeStore}>
                  <Text style={styles.badgeStoreText}>Loja</Text>
                </View>
              ) : null}
              {post.official ? (
                <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" />
              ) : null}
              {channelName ? (
                <View style={styles.badgeChannel}>
                  <Text style={styles.badgeChannelText} numberOfLines={1}>
                    {channelName}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.metaLine} numberOfLines={1}>
              {post.official && post.officialRole
                ? `${post.officialRole}${post.officialInstitution ? ` · ${post.officialInstitution}` : ''} · ${timeLabel}`
                : locationLabel
                  ? `${locationLabel} · ${timeLabel}`
                  : `${handleLabel} · ${timeLabel}`}
            </Text>
          </View>
        </Pressable>

        {onDelete ? (
          <Pressable
            onPress={onDelete}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Excluir publicação"
            style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconPressed]}
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </Pressable>
        ) : (
          <View ref={menuBtnRef} collapsable={false}>
            <Pressable
              onPress={openOverflowMenu}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Opções da publicação"
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconPressed]}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
            </Pressable>
          </View>
        )}
      </View>

      <ForumPostOverflowMenu
        visible={menuOpen}
        anchor={menuAnchor}
        canViewProfile={canViewProfile}
        canReport={canReportPost}
        canDelete={isOwnPost && !onDelete}
        onClose={closeOverflowMenu}
        onViewProfile={handleViewProfile}
        onReport={handleReportPost}
        onDelete={confirmDeletePost}
      />

      {coupon ? (
        <View style={styles.couponBanner}>
          <Ionicons name="pricetag" size={16} color="#0d9488" />
          <View style={styles.couponTextWrap}>
            <Text style={styles.couponName} numberOfLines={1}>
              {coupon.name}
            </Text>
            <Text style={styles.couponMeta}>
              {coupon.discountPercent}% · código {coupon.code}
            </Text>
          </View>
        </View>
      ) : null}

      {post.eventId || post.commercialAccountId ? (
        <View style={styles.tagRow}>
          {post.eventId ? (
            <Pressable
              style={styles.tagChip}
              onPress={() =>
                router.push({ pathname: '/evento/[id]', params: { id: post.eventId! } })
              }
            >
              <Ionicons name="calendar-outline" size={14} color="#0f766e" />
              <Text style={styles.tagChipText} numberOfLines={1}>
                {post.eventTitle?.trim() || 'Evento'}
              </Text>
            </Pressable>
          ) : null}
          {post.commercialAccountId ? (
            <Pressable
              style={styles.tagChip}
              onPress={() =>
                router.push({
                  pathname: '/forum/store',
                  params: {
                    commercialId: post.commercialAccountId!,
                    storeName: post.commercialStoreName ?? '',
                  },
                })
              }
            >
              <Ionicons name="storefront-outline" size={14} color="#0f766e" />
              <Text style={styles.tagChipText} numberOfLines={1}>
                {post.commercialStoreName?.trim() || 'Empresa'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {postImageUri ? (
        postIsVideo ? (
          <FeedMedia
            uri={postImageUri}
            contentType={post.mediaContentType}
            style={styles.media}
          />
        ) : (
          <Pressable
            onPress={() => setLightboxOpen(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel="Ampliar foto da publicação"
          >
            <FeedMedia uri={postImageUri} contentType={post.mediaContentType} style={styles.media} />
          </Pressable>
        )
      ) : null}

      <View style={styles.footer}>
        <View style={styles.actionsRow}>
          <View style={styles.actionGroup}>
            <Pressable
              onPress={onLike}
              disabled={!canInteract}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={post.liked ? 'Descurtir' : 'Curtir'}
            >
              <Ionicons
                name={post.liked ? 'heart' : 'heart-outline'}
                size={26}
                color={post.liked ? '#e11d48' : '#0f172a'}
              />
            </Pressable>
            <Pressable
              onPress={handleOpenLikes}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Ver curtidas"
            >
              <Text style={styles.likesText}>
                {post.likesCount === 1 ? '1 curtida' : `${post.likesCount} curtidas`}
              </Text>
            </Pressable>
          </View>
          <View style={styles.actionGroup}>
            <Pressable
              onPress={onToggleComments}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Ver comentários"
            >
              <Ionicons name="chatbubble-outline" size={24} color="#0f172a" />
            </Pressable>
            <Pressable
              onPress={onToggleComments}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Ver comentários"
            >
              <Text style={styles.likesText}>{formatComentariosLabel(post.commentsCount)}</Text>
            </Pressable>
          </View>
        </View>

        {bodyText ? (
          <Text style={styles.caption}>
            <Text
              style={styles.captionAuthor}
              onPress={() => (isStorePost ? openStoreHeader() : openAuthor(post.author))}
            >
              {displayName}{' '}
            </Text>
            {bodyText}
          </Text>
        ) : null}

        {commentsExpanded ? (
          <View style={styles.commentsSection}>
            {comments.map((c) => {
              const isOwnComment = !!user?.id && c.userId?.trim() === user.id.trim();
              const canReportComment = canInteract && !isOwnComment;
              const commentAuthorId = c.author?.id?.trim() || c.userId?.trim() || '';
              const commentName = personDisplayName(c.author?.name, 'Morador(a)');
              const commentPhoto = c.author?.photoUrl?.trim();
              const openCommentAuthor = () => {
                if (!commentAuthorId) return;
                openForumAuthorProfile(
                  {
                    id: commentAuthorId,
                    name: c.author?.name ?? commentName,
                    photoUrl: c.author?.photoUrl ?? null,
                  },
                  router,
                );
              };
              return (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentMain}>
                    <Pressable
                      onPress={openCommentAuthor}
                      disabled={!commentAuthorId}
                      style={styles.commentPerson}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver perfil de ${commentName}`}
                    >
                      {commentPhoto ? (
                        <Image source={{ uri: commentPhoto }} style={styles.commentAvatar} />
                      ) : (
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>
                            {commentName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.commentAuthorName} numberOfLines={1}>
                        {commentName}
                      </Text>
                    </Pressable>
                    <Text style={styles.commentBody}>{c.content}</Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                  </View>
                  {canReportComment ? (
                    <Pressable
                      onPress={() => handleReportComment(c)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Denunciar comentário"
                      style={({ pressed }) => [
                        styles.commentReportBtn,
                        pressed && styles.commentReportBtnPressed,
                      ]}
                    >
                      <Ionicons name="flag-outline" size={16} color="#94a3b8" />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}

            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder={
                  canComposeComment
                    ? 'Adicione um comentário...'
                    : 'Comentários indisponíveis no momento'
                }
                placeholderTextColor={AppColors.text.quaternary}
                value={commentDraft}
                onChangeText={onCommentDraftChange}
                editable={canComposeComment && !commentSending}
              />
              <Pressable
                onPress={() => {
                  if (!canComposeComment) {
                    void requestForumComment(() => {});
                    return;
                  }
                  void requestForumComment(onSendComment);
                }}
                disabled={!canInteract || !commentDraft.trim() || commentSending}
                style={({ pressed }) => [
                  styles.commentSendBtn,
                  (!canInteract || !commentDraft.trim() || commentSending) &&
                    styles.commentSendBtnDisabled,
                  pressed && styles.commentSendBtnPressed,
                ]}
              >
                {commentSending ? (
                  <ActivityIndicator size="small" color={AppColors.text.white} />
                ) : (
                  <Ionicons name="send" size={16} color={AppColors.text.white} />
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <LostAnimalImageLightbox
        visible={lightboxOpen && !!postImageUri && !postIsVideo}
        imageSource={postImageUri ? { uri: postImageUri } : null}
        title={displayName}
        onClose={() => setLightboxOpen(false)}
      />
      <FeedLikesSheet
        visible={likesOpen}
        likers={likers}
        likesCount={post.likesCount}
        loading={likesLoading}
        onClose={() => setLikesOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingBottom: 4,
  },
  cardDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  authorName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeStore: {
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeStoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c2410c',
  },
  badgeChannel: {
    flexShrink: 1,
    backgroundColor: '#ecfeff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 120,
  },
  badgeChannelText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primaryLight,
  },
  metaLine: {
    fontSize: 12,
    color: '#64748b',
  },
  headerIconBtn: {
    padding: 4,
  },
  headerIconPressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStore: {
    backgroundColor: '#d97706',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f0fdfa',
  },
  tagChipText: { flexShrink: 1, color: '#0f766e', fontWeight: '700', fontSize: 12 },
  couponBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#99f6e4',
  },
  couponTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  couponName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
  },
  couponMeta: {
    fontSize: 12,
    color: '#0d9488',
    marginTop: 2,
  },
  media: {
    alignSelf: 'stretch',
    aspectRatio: 4 / 5,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    paddingVertical: 2,
  },
  actionBtnPressed: {
    opacity: 0.65,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0f172a',
  },
  captionAuthor: {
    fontWeight: '700',
  },
  commentsSection: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentMain: {
    flex: 1,
    minWidth: 0,
  },
  commentPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 2,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  commentReportBtn: {
    paddingTop: 2,
    paddingHorizontal: 4,
  },
  commentReportBtnPressed: {
    opacity: 0.6,
  },
  commentAuthorName: {
    fontWeight: '700',
    color: '#0f172a',
  },
  commentBody: {
    fontWeight: '400',
    color: '#334155',
  },
  commentTime: {
    fontSize: 11,
    color: AppColors.text.quaternary,
    marginTop: 2,
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: AppColors.text.secondary,
    backgroundColor: '#f8fafc',
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnDisabled: {
    opacity: 0.4,
  },
  commentSendBtnPressed: {
    opacity: 0.85,
  },
});
