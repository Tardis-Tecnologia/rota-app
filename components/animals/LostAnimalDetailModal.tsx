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
import { formatTimeAgo, openForumAuthorProfile } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import type { ForumPostCommentListItemDto } from '@/services/forumApi';
import { findOrCreateDirectStreamChannel } from '@/services/streamChatApi';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { personDisplayName, streamAndUiDisplayName } from '@/utils/userDisplayName';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LostAnimalDetailModalProps = {
  item: LostAnimalDto | null;
  imageCacheEpoch: number;
  visible: boolean;
  comments: ForumPostCommentListItemDto[];
  commentsLoading: boolean;
  commentDraft: string;
  commentSending: boolean;
  canComment: boolean;
  onClose: () => void;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
};

function openPhoneOrEmail(contact: string) {
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

export default function LostAnimalDetailModal({
  item,
  imageCacheEpoch,
  visible,
  comments,
  commentsLoading,
  commentDraft,
  commentSending,
  canComment,
  onClose,
  onCommentDraftChange,
  onSendComment,
}: LostAnimalDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    setImageFailed(false);
    setLightboxOpen(false);
    setChatError(null);
    setChatLoading(false);
  }, [item?.id, visible]);

  const imageSource = useMemo(
    () => (item ? lostAnimalImageSource(item, imageCacheEpoch) : null),
    [item, imageCacheEpoch],
  );

  const peerUserId = item?.author?.id?.trim() || item?.userId?.trim() || '';
  const isSelf = !!user?.id && !!peerUserId && user.id.trim() === peerUserId;
  const isVisitante = user?.profile === 'VISITANTE';
  const canInteract = !!user && !isVisitante;
  const peerName = personDisplayName(item?.author?.name, 'Morador(a)');
  const peerPhoto = item?.author?.photoUrl?.trim() || '';
  const contactLabel = item ? formatContactDisplay(item.contact) : '';
  const canCall = !!item?.contact?.trim();
  const hasForumPost = !!item?.forumPostId?.trim();
  const commentsCount = Math.max(item?.commentsCount ?? 0, comments.length);

  const onCall = useCallback(() => {
    if (!item?.contact?.trim()) return;
    openPhoneOrEmail(item.contact);
  }, [item]);

  const onChat = useCallback(async () => {
    if (!item) return;
    if (!user || isVisitante) {
      promptVisitanteLogin('enviar mensagem sobre o animal');
      return;
    }
    if (!peerUserId) {
      setChatError('Não foi possível identificar o responsável pela publicação.');
      return;
    }
    if (isSelf) {
      setChatError('Esta é a sua publicação.');
      return;
    }

    setChatLoading(true);
    setChatError(null);
    try {
      const channel = await findOrCreateDirectStreamChannel({
        currentUserId: user.id,
        currentUserDisplayName: streamAndUiDisplayName(user) ?? user.name ?? 'Usuário',
        peerUserId,
        peerName,
        peerImage: peerPhoto || undefined,
      });
      onClose();
      router.push({
        pathname: '/ChatTab',
        params: {
          provider: JSON.stringify({
            id: peerUserId,
            name: peerName,
            image: peerPhoto || undefined,
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
  }, [isSelf, isVisitante, item, onClose, peerName, peerPhoto, peerUserId, user]);

  if (!item) return null;

  const title = lostAnimalTitle(item);
  const isFound = isPetFound(item);
  const missingDateLabel = formatMissingDateLabel(item.missingDate, item.createdAt);
  const foundAtLabel = isFound ? formatFoundAtLabel(item.foundAt) : '';
  const speciesLine = [item.species?.trim(), item.breed?.trim()].filter(Boolean).join(' • ');
  const canExpandImage = !!imageSource && !imageFailed;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Ionicons name="close" size={24} color={AppColors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Perfil do animal
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {canExpandImage ? (
            <Pressable
              onPress={() => setLightboxOpen(true)}
              style={({ pressed }) => [styles.heroPress, pressed && styles.pressed]}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Ampliar foto de ${title}`}
            >
              <Image
                source={imageSource}
                style={styles.heroImage}
                resizeMode="cover"
                onError={() => setImageFailed(true)}
              />
              <View style={styles.heroHint}>
                <Ionicons name="expand-outline" size={14} color="#fff" />
                <Text style={styles.heroHintText}>Toque para ampliar</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="paw-outline" size={40} color="#94a3b8" />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={[styles.statusTag, isFound && styles.statusTagFound]}>
                <Ionicons
                  name={isFound ? 'checkmark-circle' : 'paw'}
                  size={12}
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

            <Text style={styles.name}>{title}</Text>
            {speciesLine ? <Text style={styles.species}>{speciesLine}</Text> : null}

            <View style={styles.section}>
              {!isFound && missingDateLabel ? (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  <Text style={styles.infoText}>Perdido em {missingDateLabel}</Text>
                </View>
              ) : null}
              {foundAtLabel ? (
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#047857" />
                  <Text style={[styles.infoText, styles.foundText]}>
                    Encontrado em {foundAtLabel}
                  </Text>
                </View>
              ) : null}
              {item.missingLocation?.trim() ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={18} color="#64748b" />
                  <Text style={styles.infoText}>{item.missingLocation.trim()}</Text>
                </View>
              ) : null}
              {contactLabel ? (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color="#64748b" />
                  <Text style={styles.infoText}>{contactLabel}</Text>
                </View>
              ) : null}
            </View>

            {item.description?.trim() ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descrição</Text>
                <Text style={styles.description}>{item.description.trim()}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Publicado por</Text>
              <Pressable
                style={styles.authorRow}
                disabled={!peerUserId}
                onPress={() => {
                  if (!peerUserId) return;
                  onClose();
                  openForumAuthorProfile(
                    { id: peerUserId, name: peerName, photoUrl: peerPhoto || null },
                    router,
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${peerName}`}
              >
                {peerPhoto ? (
                  <Image source={{ uri: peerPhoto }} style={styles.authorAvatar} />
                ) : (
                  <View style={styles.authorAvatarFallback}>
                    <Text style={styles.authorAvatarLetter}>
                      {peerName.charAt(0).toUpperCase() || 'M'}
                    </Text>
                  </View>
                )}
                <View style={styles.authorText}>
                  <Text style={styles.authorName}>{peerName}</Text>
                  <Text style={styles.authorHint}>
                    {isSelf ? 'Você' : 'Responsável pelo aviso'}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.commentsHeader}>
                <Text style={styles.sectionTitle}>Comentários</Text>
                <Text style={styles.commentsCount}>{commentsCount}</Text>
              </View>

              {commentsLoading ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={styles.commentsLoadingText}>Carregando comentários...</Text>
                </View>
              ) : null}

              {!commentsLoading && !hasForumPost ? (
                <Text style={styles.commentsHint}>Comentários indisponíveis.</Text>
              ) : null}

              {!commentsLoading && hasForumPost
                ? comments.map((c) => {
                    const commentName = (c.author?.name || 'Morador(a)').trim();
                    const commentAuthorId = c.author?.id?.trim() || c.userId?.trim() || '';
                    return (
                    <View key={c.id} style={styles.commentItem}>
                      <Pressable
                        disabled={!commentAuthorId}
                        onPress={() => {
                          if (!commentAuthorId) return;
                          onClose();
                          openForumAuthorProfile(
                            {
                              id: commentAuthorId,
                              name: commentName,
                              photoUrl: c.author?.photoUrl ?? null,
                            },
                            router,
                          );
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver perfil de ${commentName}`}
                      >
                        <Text style={styles.commentAuthor}>{commentName}</Text>
                      </Pressable>
                      <Text style={styles.commentBody}>{c.content}</Text>
                      <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                    </View>
                    );
                  })
                : null}

              {!commentsLoading && hasForumPost && comments.length === 0 ? (
                <Text style={styles.commentsHint}>Nenhum comentário ainda. Seja o primeiro!</Text>
              ) : null}

              {hasForumPost ? (
                <View style={styles.commentComposer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder={
                      canComment ? 'Escreva um comentário...' : 'Faça login para comentar'
                    }
                    placeholderTextColor={AppColors.text.quaternary}
                    value={commentDraft}
                    onChangeText={onCommentDraftChange}
                    editable={canComment && !commentSending}
                    multiline
                  />
                  <Pressable
                    onPress={onSendComment}
                    disabled={!canComment || !commentDraft.trim() || commentSending}
                    style={({ pressed }) => [
                      styles.commentSendBtn,
                      (!canComment || !commentDraft.trim() || commentSending) &&
                        styles.commentSendBtnDisabled,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Enviar comentário"
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

            {chatError ? <Text style={styles.chatError}>{chatError}</Text> : null}
          </View>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            onPress={onCall}
            disabled={!canCall}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.callBtn,
              !canCall && styles.actionBtnDisabled,
              pressed && canCall && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ligar para o responsável"
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Ligar</Text>
          </Pressable>

          <Pressable
            onPress={() => void onChat()}
            disabled={chatLoading || (canInteract && isSelf)}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.chatBtn,
              (chatLoading || (canInteract && isSelf)) && styles.actionBtnDisabled,
              pressed && !chatLoading && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem no chat"
          >
            {chatLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Mensagem</Text>
              </>
            )}
          </Pressable>
        </View>

        <LostAnimalImageLightbox
          visible={lightboxOpen}
          imageSource={imageSource}
          title={title}
          onClose={() => setLightboxOpen(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  heroPress: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  heroImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e2e8f0',
  },
  heroHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  heroHintText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  heroPlaceholder: {
    marginHorizontal: 16,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  titleRow: {
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
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagFound: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 11, fontWeight: '800', color: '#c2410c' },
  statusTextFound: { color: '#047857' },
  timeText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  species: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    marginTop: -6,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  foundText: { color: '#047857', fontWeight: '600' },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
  },
  authorAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarLetter: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  authorText: { flex: 1, minWidth: 0, gap: 2 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  authorHint: { fontSize: 12, color: '#64748b' },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsLoadingText: { fontSize: 12, color: AppColors.text.tertiary },
  commentsHint: { fontSize: 13, color: AppColors.text.quaternary },
  commentItem: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#a7f3d0',
    gap: 2,
  },
  commentAuthor: { fontSize: 13, fontWeight: '800', color: '#334155' },
  commentBody: { fontSize: 14, color: '#475569', lineHeight: 20 },
  commentTime: { fontSize: 11, color: AppColors.text.quaternary },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.text.secondary,
    backgroundColor: '#fff',
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnDisabled: { opacity: 0.4 },
  chatError: {
    fontSize: 13,
    color: AppColors.status.error,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callBtn: { backgroundColor: '#059669' },
  chatBtn: { backgroundColor: '#0f766e' },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: { opacity: 0.88 },
});
