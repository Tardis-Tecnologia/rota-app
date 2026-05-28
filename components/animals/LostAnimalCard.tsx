import LostAnimalImageLightbox from '@/components/animals/LostAnimalImageLightbox';
import {
    formatContactDisplay,
    formatFoundAtLabel,
    formatMissingDateLabel,
    isPetFound,
    lostAnimalImageSource,
    lostAnimalTitle,
    type LostAnimalDto,
} from '@/components/animals/lostAnimalUtils';
import { formatTimeAgo } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import type { ForumPostCommentListItemDto } from '@/services/forumApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface LostAnimalCardProps {
  item: LostAnimalDto;
  imageCacheEpoch: number;
  canInteract: boolean;
  comments: ForumPostCommentListItemDto[];
  commentsExpanded: boolean;
  commentDraft: string;
  commentSending: boolean;
  commentsLoading: boolean;
  isOwner: boolean;
  onLike: () => void;
  onToggleComments: () => void;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
  onOpenActions: () => void;
}

function openContact(contact: string) {
  const t = contact.trim();
  if (!t) return;
  if (t.includes('@')) {
    void Linking.openURL(`mailto:${t}`);
    return;
  }
  const digits = t.replace(/\D/g, '');
  if (digits.length >= 10) {
    void Linking.openURL(`tel:${digits}`);
  }
}

export default function LostAnimalCard({
  item,
  imageCacheEpoch,
  canInteract,
  comments,
  commentsExpanded,
  commentDraft,
  commentSending,
  commentsLoading,
  isOwner,
  onLike,
  onToggleComments,
  onCommentDraftChange,
  onSendComment,
  onOpenActions,
}: LostAnimalCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageSource = lostAnimalImageSource(item, imageCacheEpoch);
  const canExpandImage = !!imageSource && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
    setLightboxOpen(false);
  }, [item.id, item.mediaId, item.imageUrl, imageCacheEpoch]);

  const title = lostAnimalTitle(item);
  const isFound = isPetFound(item);
  const missingDateLabel = formatMissingDateLabel(item.missingDate, item.createdAt);
  const foundAtLabel = isFound ? formatFoundAtLabel(item.foundAt) : '';
  const contactLabel = formatContactDisplay(item.contact);
  const speciesLine = [item.species?.trim(), item.breed?.trim()].filter(Boolean).join(' • ');
  const canComment = canInteract && !!item.forumPostId?.trim();

  return (
    <View style={[styles.card, isFound && styles.cardFound]}>
      <View style={styles.mainRow}>
        {canExpandImage ? (
          <Pressable
            onPress={() => setLightboxOpen(true)}
            style={({ pressed }) => [styles.thumbPress, pressed && styles.thumbPressPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Ampliar foto de ${title}`}
          >
            <Image
              source={imageSource}
              style={styles.thumb}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          </Pressable>
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="image-outline" size={28} color="#94a3b8" />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.topMetaRow}>
            <View style={[styles.statusTag, isFound && styles.statusTagFound]}>
              <Ionicons
                name={isFound ? 'checkmark-circle' : 'paw'}
                size={11}
                color={isFound ? '#047857' : '#c2410c'}
              />
              <Text style={[styles.statusText, isFound && styles.statusTextFound]}>
                {isFound ? 'Encontrado' : 'Perdido'}
              </Text>
            </View>
            {item.createdAt ? (
              <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
            ) : null}
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>

          {speciesLine ? (
            <View style={styles.infoRow}>
              <Ionicons name="paw-outline" size={14} color="#64748b" />
              <Text style={styles.infoText} numberOfLines={1}>
                {speciesLine}
              </Text>
            </View>
          ) : null}

          {missingDateLabel ? (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
              <Text style={styles.infoText} numberOfLines={1}>
                Perdido em {missingDateLabel}
              </Text>
            </View>
          ) : null}

          {foundAtLabel ? (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#047857" />
              <Text style={[styles.infoText, styles.foundAtText]} numberOfLines={1}>
                Encontrado em {foundAtLabel}
              </Text>
            </View>
          ) : null}

          {item.missingLocation ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.infoText} numberOfLines={2}>
                {item.missingLocation}
              </Text>
            </View>
          ) : null}

          {contactLabel ? (
            <Pressable
              style={({ pressed }) => [styles.contactBtn, pressed && styles.contactBtnPressed]}
              onPress={() => openContact(item.contact)}
            >
              <Ionicons name="call-outline" size={16} color="#059669" />
              <Text style={styles.contactBtnText} numberOfLines={1}>
                {contactLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onLike}
          disabled={!canInteract || !item.forumPostId?.trim()}
          style={({ pressed }) => [styles.footerBtn, pressed && styles.footerBtnPressed]}
        >
          <Ionicons
            name={item.liked ? 'heart' : 'heart-outline'}
            size={18}
            color={item.liked ? '#e11d48' : '#64748b'}
          />
          <Text style={styles.footerCount}>{item.likesCount ?? 0}</Text>
        </Pressable>

        <Pressable
          onPress={onToggleComments}
          style={({ pressed }) => [styles.footerBtn, pressed && styles.footerBtnPressed]}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
          <Text style={styles.footerCount}>{item.commentsCount ?? 0}</Text>
        </Pressable>

        <View style={styles.footerSpacer} />

        {isOwner ? (
          <Pressable
            onPress={onOpenActions}
            hitSlop={10}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.footerBtnPressed]}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
          </Pressable>
        ) : null}
      </View>

      {commentsExpanded ? (
        <View style={styles.commentsSection}>
          {commentsLoading ? (
            <View style={styles.commentsLoading}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.commentsLoadingText}>Carregando comentários...</Text>
            </View>
          ) : null}

          {!commentsLoading && !item.forumPostId?.trim() ? (
            <Text style={styles.commentsHint}>Comentários indisponíveis.</Text>
          ) : null}

          {!commentsLoading && item.forumPostId?.trim()
            ? comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>
                    {(c.author?.name || 'Morador(a)').trim()}
                  </Text>
                  <Text style={styles.commentBody}>{c.content}</Text>
                  <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                </View>
              ))
            : null}

          {!commentsLoading && item.forumPostId?.trim() && comments.length === 0 ? (
            <Text style={styles.commentsHint}>Nenhum comentário ainda.</Text>
          ) : null}

          {item.forumPostId?.trim() ? (
            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder={canComment ? 'Escreva um comentário...' : 'Faça login para comentar'}
                placeholderTextColor={AppColors.text.quaternary}
                value={commentDraft}
                onChangeText={onCommentDraftChange}
                editable={canComment && !commentSending}
              />
              <Pressable
                onPress={onSendComment}
                disabled={!canComment || !commentDraft.trim() || commentSending}
                style={({ pressed }) => [
                  styles.commentSendBtn,
                  (!canComment || !commentDraft.trim() || commentSending) &&
                    styles.commentSendBtnDisabled,
                  pressed && styles.commentSendBtnPressed,
                ]}
              >
                {commentSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <LostAnimalImageLightbox
        visible={lightboxOpen}
        imageSource={imageSource}
        title={title}
        onClose={() => setLightboxOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8ecf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFound: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f7fef9',
  },
  mainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbPress: {
    position: 'relative',
  },
  thumbPressPressed: {
    opacity: 0.88,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  thumbPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagFound: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 10, fontWeight: '800', color: '#c2410c' },
  statusTextFound: { color: '#047857' },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
  },
  foundAtText: {
    color: '#047857',
    fontWeight: '600',
    lineHeight: 17,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  contactBtnPressed: { opacity: 0.85, backgroundColor: '#ecfdf5' },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerBtnPressed: { opacity: 0.7 },
  footerCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  footerSpacer: { flex: 1 },
  menuBtn: { padding: 4 },
  commentsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsLoadingText: { fontSize: 12, color: AppColors.text.tertiary },
  commentsHint: { fontSize: 12, color: AppColors.text.quaternary },
  commentItem: {
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#a7f3d0',
  },
  commentAuthor: { fontSize: 12, fontWeight: '800', color: '#334155' },
  commentBody: { fontSize: 13, color: '#475569', marginTop: 2, lineHeight: 18 },
  commentTime: { fontSize: 10, color: AppColors.text.quaternary, marginTop: 2 },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: AppColors.text.secondary,
    backgroundColor: '#fff',
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnDisabled: { opacity: 0.4 },
  commentSendBtnPressed: { opacity: 0.85 },
});
