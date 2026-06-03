import { formatOpinioesLabel, formatTimeAgo } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { NewsCommentListItemDto } from '@/services/newsApi';
import type { FeedNovidade } from '@/types/feedNovidade';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
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

interface FeedNovidadeCardProps {
  item: FeedNovidade;
  imageCacheEpoch: number;
  comments: NewsCommentListItemDto[];
  commentDraft: string;
  commentsExpanded: boolean;
  commentsLoading: boolean;
  commentSending: boolean;
  canInteract: boolean;
  onOpenDetail: () => void;
  onLike: () => void;
  onToggleComments: () => void;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
}

function formatHandleLine(handle: string, dataRelativa: string): string {
  const h = handle.startsWith('@') ? handle : `@${handle}`;
  const time = dataRelativa.replace(/^há\s+/i, '').trim() || dataRelativa;
  return `${h} · ${time}`;
}

function commentAuthorName(c: NewsCommentListItemDto): string {
  return (c.author?.name || 'Morador(a)').trim();
}

export default function FeedNovidadeCard({
  item,
  imageCacheEpoch,
  comments,
  commentDraft,
  commentsExpanded,
  commentsLoading,
  commentSending,
  canInteract,
  onOpenDetail,
  onLike,
  onToggleComments,
  onCommentDraftChange,
  onSendComment,
  style,
  showDivider = true,
}: FeedNovidadeCardProps) {
  const { name: themeName } = useAppTheme();

  const displayName = useMemo(() => {
    if (item.autorNome && item.autorNome !== 'Prefeito') return item.autorNome;
    const themed = themeName?.trim();
    if (themed && themed !== 'Default') {
      return themed.toLowerCase().includes('prefeitura') ? themed : `Prefeitura de ${themed}`;
    }
    return 'Prefeitura';
  }, [item.autorNome, themeName]);

  const imageUri = useMemo(() => {
    if (!item.imagem) return null;
    return item.imagem.includes('?')
      ? `${item.imagem}&v=${imageCacheEpoch}`
      : `${item.imagem}?v=${imageCacheEpoch}`;
  }, [item.imagem, imageCacheEpoch]);

  const bodyText = useMemo(() => {
    const resumo = item.resumo?.trim();
    const titulo = item.titulo?.trim();
    if (resumo && titulo && resumo !== titulo && !resumo.startsWith(titulo)) {
      return `${titulo}\n\n${resumo}`;
    }
    return resumo || titulo || '';
  }, [item.resumo, item.titulo]);

  return (
    <View style={[styles.row, showDivider && styles.rowDivider, style]}>
      <Image source={{ uri: item.autorAvatar }} style={styles.avatar} />

      <View style={styles.main}>
        <Pressable
          onPress={onOpenDetail}
          style={({ pressed }) => [pressed && styles.contentPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Abrir publicação: ${item.titulo}`}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.authorName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.metaLine} numberOfLines={1}>
                {formatHandleLine(item.autorHandle, item.dataRelativa)}
              </Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={18} color="#536471" />
          </View>

          <Text style={styles.body}>{bodyText}</Text>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.media} resizeMode="cover" />
          ) : null}
        </Pressable>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onLike}
            disabled={!canInteract}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={item.liked ? 'Descurtir' : 'Curtir'}
          >
            <Ionicons
              name={item.liked ? 'heart' : 'heart-outline'}
              size={18}
              color={item.liked ? '#e11d48' : '#536471'}
            />
            <Text style={[styles.actionCount, item.liked && styles.likeCountActive]}>
              {item.curtidas}
            </Text>
          </Pressable>
          <Pressable
            onPress={onToggleComments}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Ver opiniões"
          >
            <Ionicons name="chatbubble-outline" size={18} color="#0891b2" />
            <Text style={styles.commentLabel}>{formatOpinioesLabel(item.comentarios)}</Text>
          </Pressable>
        </View>

        {commentsExpanded ? (
          <View style={styles.commentsSection}>
            {commentsLoading ? (
              <ActivityIndicator size="small" color={AppColors.primary} style={styles.commentsLoader} />
            ) : comments.length === 0 ? (
              <Text style={styles.commentsEmpty}>Nenhuma opinião ainda. Seja o primeiro!</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentAuthorRow}>
                    <Text style={styles.commentAuthorName} numberOfLines={1}>
                      {commentAuthorName(c)}
                    </Text>
                  </View>
                  <Text style={styles.commentBody}>{c.content}</Text>
                  <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                </View>
              ))
            )}

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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eff3f4',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  contentPressed: {
    opacity: 0.92,
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
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f1419',
  },
  metaLine: {
    fontSize: 14,
    color: '#536471',
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: '#0f1419',
    marginTop: 4,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
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
  commentLabel: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '600',
  },
  likeCountActive: {
    color: '#e11d48',
  },
  commentsSection: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 10,
  },
  commentsLoader: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  commentsEmpty: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  commentItem: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#cffafe',
  },
  commentAuthorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
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
