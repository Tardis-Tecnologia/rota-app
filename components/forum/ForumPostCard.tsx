import { formatOpinioesLabel, formatTimeAgo } from '@/components/forum/forumUtils';
import ForumPostOverflowMenu, {
  type ForumPostOverflowAnchor,
} from '@/components/forum/ForumPostOverflowMenu';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useForumModeration } from '@/contexts/ForumModerationContext';
import type { ForumPostCommentListItemDto, ForumPostResponseDto } from '@/services/forumApi';
import { confirmAndSubmitForumReport } from '@/utils/forumReportFlow';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  forumPostImageUrl,
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
  onToggleComments: () => void;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
  onOpenStore?: () => void;
  onDelete?: () => void;
  onReportPost?: () => void;
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
}

function formatForumMetaLine(
  post: ForumPostResponseDto,
  isStorePost: boolean,
): string {
  const time = formatTimeAgo(post.createdAt);
  if (isStorePost) return `Comércio local · ${time}`;
  return `${forumDisplayHandle(post.author)} · ${time}`;
}

function buildPostBody(title: string, content: string): string {
  const t = title.trim();
  const c = content.trim();
  if (t && c && t !== c && !c.startsWith(t)) return `${t}\n\n${c}`;
  return c || t || '';
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
  onToggleComments,
  onCommentDraftChange,
  onSendComment,
  onOpenStore,
  onDelete,
  onReportPost,
  style,
  showDivider = true,
}: ForumPostCardProps) {
  const { user } = useAuth();
  const { canComment: canCommentForum, requestForumComment } = useForumModeration();
  const menuBtnRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<ForumPostOverflowAnchor | null>(null);
  const isStorePost = isPartnerStoreForumPost(post);
  const storeAuthor = post.authorCommercial;
  const authorPhotoRaw = isStorePost
    ? storeAuthor?.photoUrl?.trim()
    : post.author?.photoUrl?.trim();
  const authorPhoto = authorPhotoRaw
    ? withListImageCacheBust(authorPhotoRaw, imageCacheEpoch)
    : '';
  const postImageRaw = forumPostImageUrl(post.mediaId);
  const postImageUri = postImageRaw
    ? withListImageCacheBust(postImageRaw, imageCacheEpoch)
    : null;
  const displayName = isStorePost
    ? (storeAuthor?.storeName || 'Loja parceira').trim()
    : (post.author?.name || 'Morador(a)').trim();
  const initial = displayName.charAt(0).toUpperCase() || 'A';
  const coupon = post.promotedCoupon;
  const bodyText = useMemo(
    () => buildPostBody(post.title, post.content),
    [post.title, post.content],
  );
  const metaLine = useMemo(
    () => formatForumMetaLine(post, isStorePost),
    [post, isStorePost],
  );

  const openAuthor = useCallback(
    (author: typeof post.author) => {
      openForumAuthorProfile(author, router);
    },
    [],
  );

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

  const handleReportPost = useCallback(() => {
    if (!canInteract) {
      promptVisitanteLogin('denunciar publicações no fórum');
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
        promptVisitanteLogin('denunciar comentários no fórum');
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
    <View style={[styles.row, showDivider && styles.rowDivider, style]}>
      <Pressable
        onPress={() => (isStorePost ? openStoreHeader() : openAuthor(post.author))}
        disabled={isStorePost ? !canOpenStoreProfile : !post.author?.id}
      >
        {avatarNode}
      </Pressable>

      <View style={styles.main}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.headerText}
            onPress={() => (isStorePost ? openStoreHeader() : openAuthor(post.author))}
            disabled={isStorePost ? !canOpenStoreProfile : !post.author?.id}
          >
            <Text style={styles.authorName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {metaLine}
            </Text>
          </Pressable>
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Excluir publicação"
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconPressed]}
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
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
                <Ionicons name="ellipsis-horizontal" size={18} color="#536471" />
              </Pressable>
            </View>
          )}
        </View>

        <ForumPostOverflowMenu
          visible={menuOpen}
          anchor={menuAnchor}
          canViewProfile={canViewProfile}
          canReport={canReportPost}
          onClose={closeOverflowMenu}
          onViewProfile={handleViewProfile}
          onReport={handleReportPost}
        />

        {isStorePost ? (
          <Pressable
            onPress={openStoreHeader}
            disabled={!canOpenStoreProfile}
            style={({ pressed }) => [styles.contextPill, styles.storePill, pressed && styles.pillPressed]}
          >
            <Ionicons name="storefront" size={12} color="#b45309" />
            <Text style={styles.storePillText} numberOfLines={1}>
              Loja parceira
            </Text>
          </Pressable>
        ) : null}

        {channelName ? (
          <View style={[styles.contextPill, styles.channelPill]}>
            <Ionicons name="people" size={12} color="#0e7490" />
            <Text style={styles.channelPillText} numberOfLines={1}>
              {channelName}
            </Text>
          </View>
        ) : null}

        <Text style={styles.body}>{bodyText}</Text>

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

        {post.mediaId && postImageUri ? (
          <Image source={{ uri: postImageUri }} style={styles.media} resizeMode="cover" />
        ) : null}

        {post.locationDescription ? (
          <Text style={styles.locationText}>📍 {post.locationDescription}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onLike}
            disabled={!canInteract}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={post.liked ? 'Descurtir' : 'Curtir'}
          >
            <Ionicons
              name={post.liked ? 'heart' : 'heart-outline'}
              size={18}
              color={post.liked ? '#e11d48' : '#536471'}
            />
            <Text style={[styles.actionCount, post.liked && styles.likeCountActive]}>
              {post.likesCount}
            </Text>
          </Pressable>
          <Pressable
            onPress={onToggleComments}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Ver opiniões"
          >
            <Ionicons name="chatbubble-outline" size={18} color="#0891b2" />
            <Text style={styles.commentLabel}>{formatOpinioesLabel(post.commentsCount)}</Text>
          </Pressable>
        </View>

        {commentsExpanded ? (
          <View style={styles.commentsSection}>
            {comments.map((c) => {
              const isOwnComment = !!user?.id && c.userId?.trim() === user.id.trim();
              const canReportComment = canInteract && !isOwnComment;
              return (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentMain}>
                    <Pressable
                      onPress={() => openAuthor(c.author)}
                      disabled={!c.author?.id}
                      style={({ pressed }) => pressed && styles.commentAuthorPressed}
                    >
                      <Text style={styles.commentAuthorName} numberOfLines={1}>
                        {(c.author?.name || 'Morador(a)').trim()}
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
                    ? 'Deixe sua opinião...'
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
                  <Ionicons name="send" size={18} color={AppColors.text.white} />
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  rowDivider: {
    borderBottomWidth: 8,
    borderBottomColor: '#eef2f6',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStore: {
    backgroundColor: '#d97706',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  headerIconBtn: {
    padding: 2,
  },
  headerIconPressed: {
    opacity: 0.6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f1419',
  },
  metaLine: {
    fontSize: 14,
    color: '#536471',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '100%',
  },
  pillPressed: {
    opacity: 0.85,
  },
  storePill: {
    backgroundColor: '#fffbeb',
  },
  storePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  channelPill: {
    backgroundColor: '#ecfeff',
  },
  channelPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0e7490',
    flexShrink: 1,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: '#0f1419',
  },
  couponBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
  actionCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  likeCountActive: {
    color: '#e11d48',
  },
  commentLabel: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '600',
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
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#cffafe',
  },
  commentMain: {
    flex: 1,
    minWidth: 0,
  },
  commentReportBtn: {
    paddingTop: 2,
    paddingHorizontal: 4,
  },
  commentReportBtnPressed: {
    opacity: 0.6,
  },
  commentAuthorPressed: {
    opacity: 0.75,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  commentBody: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 10,
    color: AppColors.text.quaternary,
    marginTop: 4,
  },
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
    backgroundColor: '#ffffff',
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0891b2',
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
