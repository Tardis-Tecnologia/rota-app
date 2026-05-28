import { AppColors } from '@/constants/theme';
import type { ForumPostCommentListItemDto, ForumPostResponseDto } from '@/services/forumApi';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  formatOpinioesLabel,
  formatTimeAgo,
  forumDisplayHandle,
  forumPostImageUrl,
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
  onContactStore?: () => void;
  contactLoading?: boolean;
  hideContactButton?: boolean;
  /** Só passar quando o usuário logado é o autor; exibe lixeira no canto superior direito. */
  onDelete?: () => void;
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
  onContactStore,
  contactLoading = false,
  hideContactButton = false,
  onDelete,
}: ForumPostCardProps) {
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

  return (
    <View style={styles.card}>
      {onDelete ? (
        <Pressable
          style={styles.deleteIconBtn}
          onPress={onDelete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Excluir publicação"
        >
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
        </Pressable>
      ) : null}
      {isStorePost ? (
        <Pressable
          onPress={openStoreHeader}
          disabled={!canOpenStoreProfile}
          style={({ pressed }) => [styles.storeTag, pressed && styles.storeTagPressed]}
        >
          <Ionicons name="storefront" size={12} color="#b45309" />
          <Text style={styles.storeTagText} numberOfLines={1}>
            Loja parceira · {displayName}
          </Text>
        </Pressable>
      ) : null}
      {channelName ? (
        <View style={styles.channelTag}>
          <Ionicons name="people" size={12} color="#0e7490" />
          <Text style={styles.channelTagText} numberOfLines={1}>
            {channelName}
          </Text>
        </View>
      ) : null}
      <Pressable
        onPress={isStorePost ? openStoreHeader : undefined}
        disabled={!canOpenStoreProfile}
      >
        <View style={styles.postTop}>
          <Pressable
            onPress={() => (isStorePost ? openStoreHeader() : openAuthor(post.author))}
            disabled={isStorePost ? !canOpenStoreProfile : !post.author?.id}
          >
            {authorPhoto ? (
              <Image source={{ uri: authorPhoto }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, isStorePost && styles.avatarStore]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.postTopBody}>
            <Pressable
              onPress={() => (isStorePost ? openStoreHeader() : openAuthor(post.author))}
              disabled={isStorePost ? !canOpenStoreProfile : !post.author?.id}
            >
              <View style={styles.nameHandleRow}>
                <Text style={styles.authorName} numberOfLines={1}>
                  {displayName}
                </Text>
                {!isStorePost ? (
                  <Text style={styles.authorHandle} numberOfLines={1}>
                    {forumDisplayHandle(post.author)}
                  </Text>
                ) : (
                  <Text style={styles.storeHandle} numberOfLines={1}>
                    Comércio local
                  </Text>
                )}
              </View>
            </Pressable>
            <Text style={styles.timeTextSmall}>{formatTimeAgo(post.createdAt)}</Text>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.content}>{post.content}</Text>
          </View>
        </View>
      </Pressable>

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
        <Image source={{ uri: postImageUri }} style={styles.postImage} resizeMode="cover" />
      ) : null}
      {post.locationDescription ? (
        <Text style={styles.locationText}>📍 {post.locationDescription}</Text>
      ) : null}

      {isStorePost && !hideContactButton && onContactStore ? (
        <Pressable
          style={({ pressed }) => [styles.contactStoreBtn, pressed && styles.contactStoreBtnPressed]}
          onPress={onContactStore}
          disabled={!canInteract || contactLoading}
        >
          {contactLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              <Text style={styles.contactStoreBtnText}>Falar com a loja</Text>
            </>
          )}
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          onPress={onLike}
          disabled={!canInteract}
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
          onPress={onToggleComments}
          style={({ pressed }) => [styles.footerOpinionsBtn, pressed && styles.footerOpinionsBtnPressed]}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#0891b2" />
          <Text style={styles.footerOpinionsLabel}>
            {formatOpinioesLabel(post.commentsCount)}
          </Text>
        </Pressable>
      </View>

      {commentsExpanded ? (
        <View style={styles.commentsSection}>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentItem}>
              <Pressable
                onPress={() => openAuthor(c.author)}
                disabled={!c.author?.id}
                style={({ pressed }) => pressed && styles.commentAuthorPressed}
              >
                <View style={styles.commentAuthorRow}>
                  <Text style={styles.commentAuthorName} numberOfLines={1}>
                    {(c.author?.name || 'Morador(a)').trim()}
                  </Text>
                  <Text style={styles.commentAuthorHandle} numberOfLines={1}>
                    {' '}
                    {forumDisplayHandle(c.author)}
                  </Text>
                </View>
              </Pressable>
              <Text style={styles.commentBody}>{c.content}</Text>
              <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
            </View>
          ))}

          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Deixe sua opinião..."
              placeholderTextColor={AppColors.text.quaternary}
              value={commentDraft}
              onChangeText={onCommentDraftChange}
              editable={canInteract && !commentSending}
            />
            <Pressable
              onPress={onSendComment}
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
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  deleteIconBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '100%',
  },
  channelTagText: { fontSize: 11, fontWeight: '800', color: '#0e7490', flexShrink: 1 },
  storeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '100%',
  },
  storeTagText: { fontSize: 11, fontWeight: '800', color: '#b45309', flexShrink: 1 },
  storeTagPressed: { opacity: 0.85 },
  postTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  avatarStore: { backgroundColor: '#d97706' },
  storeHandle: { fontSize: 12, fontWeight: '600', color: '#b45309' },
  couponBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  couponTextWrap: { flex: 1, minWidth: 0 },
  couponName: { fontSize: 14, fontWeight: '700', color: '#0f766e' },
  couponMeta: { fontSize: 12, color: '#0d9488', marginTop: 2 },
  contactStoreBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactStoreBtnPressed: { opacity: 0.9 },
  contactStoreBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  postTopBody: { flex: 1, minWidth: 0 },
  nameHandleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
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
  title: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 4, lineHeight: 20 },
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
  footerOpinionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
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
  },
  commentAuthorPressed: { opacity: 0.75 },
  commentAuthorRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  commentAuthorName: { fontSize: 12, fontWeight: '800', color: '#1e293b' },
  commentAuthorHandle: { fontSize: 12, fontWeight: '600', color: '#0891b2' },
  commentBody: { fontSize: 14, color: '#475569', marginTop: 4, lineHeight: 20 },
  commentTime: { fontSize: 10, color: AppColors.text.quaternary, marginTop: 4 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
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
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeBtnPressed: { opacity: 0.7 },
});
