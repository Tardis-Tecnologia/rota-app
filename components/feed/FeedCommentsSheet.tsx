import { formatComentariosLabel, formatTimeAgo } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { personDisplayName } from '@/utils/userDisplayName';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetComment = {
  id: string;
  content: string;
  createdAt: string;
  userId?: string;
  author?: { id?: string; name?: string | null; photoUrl?: string | null } | null;
};

type FeedCommentsSheetProps = {
  visible: boolean;
  title?: string;
  comments: SheetComment[];
  commentDraft: string;
  commentsLoading: boolean;
  commentSending: boolean;
  canInteract: boolean;
  commentsCount: number;
  onClose: () => void;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
};

function commentAuthorName(c: SheetComment): string {
  return personDisplayName(c.author?.name, 'Morador(a)');
}

export default function FeedCommentsSheet({
  visible,
  title = 'Comentários',
  comments,
  commentDraft,
  commentsLoading,
  commentSending,
  canInteract,
  commentsCount,
  onClose,
  onCommentDraftChange,
  onSendComment,
}: FeedCommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.min(Math.round(windowHeight * 0.72), 640);
  const listRef = useRef<FlatList<SheetComment>>(null);
  const prevCountRef = useRef(comments.length);

  useEffect(() => {
    if (!visible) return;
    if (comments.length > prevCountRef.current) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
    prevCountRef.current = comments.length;
  }, [comments.length, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheetWrap, { height: sheetHeight }]}
        >
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{formatComentariosLabel(commentsCount)}</Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar comentários"
              >
                <Ionicons name="close" size={20} color={AppColors.text.secondary} />
              </Pressable>
            </View>

            <View style={styles.body}>
              {commentsLoading && comments.length === 0 ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color={AppColors.primary} />
                </View>
              ) : comments.length === 0 && commentsCount > 0 ? (
                <View style={styles.centerState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={36} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>Comentários não carregaram</Text>
                  <Text style={styles.emptyHint}>Feche e abra de novo para tentar outra vez.</Text>
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.centerState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={36} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>Nenhum comentário ainda</Text>
                  <Text style={styles.emptyHint}>Seja o primeiro a comentar.</Text>
                </View>
              ) : (
                <FlatList
                  ref={listRef}
                  data={comments}
                  keyExtractor={(c) => c.id}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
                  renderItem={({ item: c }) => {
                    const name = commentAuthorName(c);
                    const authorId = c.author?.id?.trim() || c.userId?.trim() || '';
                    const photo = c.author?.photoUrl?.trim();
                    return (
                      <View style={styles.commentRow}>
                        <Pressable
                          onPress={() => {
                            if (!authorId) return;
                            onClose();
                            router.push({
                              pathname: '/forum/author',
                              params: {
                                userId: authorId,
                                name,
                                photoUrl: photo ?? '',
                              },
                            });
                          }}
                          disabled={!authorId}
                          style={({ pressed }) => [
                            styles.commentPerson,
                            pressed && authorId ? styles.commentPersonPressed : null,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Ver perfil de ${name}`}
                        >
                          {photo ? (
                            <Image source={{ uri: photo }} style={styles.commentAvatar} />
                          ) : (
                            <View style={styles.commentAvatar}>
                              <Text style={styles.commentAvatarText}>
                                {name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.commentAuthor} numberOfLines={1}>
                            {name}
                          </Text>
                        </Pressable>
                        <View style={styles.commentMain}>
                          <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                          <Text style={styles.commentBody}>{c.content}</Text>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </View>

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder={canInteract ? 'Escreva um comentário...' : 'Faça login para comentar'}
                placeholderTextColor={AppColors.text.quaternary}
                value={commentDraft}
                onChangeText={onCommentDraftChange}
                editable={canInteract && !commentSending}
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={onSendComment}
                disabled={!canInteract || !commentDraft.trim() || commentSending}
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!canInteract || !commentDraft.trim() || commentSending) && styles.sendBtnDisabled,
                  pressed && styles.sendBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Enviar comentário"
              >
                {commentSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  centerState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  commentRow: {
    gap: 6,
  },
  commentPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  commentPersonPressed: {
    opacity: 0.7,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369a1',
  },
  commentMain: {
    flex: 1,
    minWidth: 0,
  },
  commentMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  commentTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  commentBody: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.text.secondary,
    backgroundColor: '#f8fafc',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
});
