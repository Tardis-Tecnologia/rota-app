import FeedMedia from '@/components/feed/FeedMedia';
import { formatComentariosLabel } from '@/components/forum/forumUtils';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { FeedNovidade } from '@/types/feedNovidade';
import { feedPublisherDisplayName } from '@/utils/feedPublisher';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export interface FeedNovidadeCardBodyProps {
  item: FeedNovidade;
  imageCacheEpoch: number;
  canInteract: boolean;
  onOpenDetail: () => void;
  onLike: () => void;
  onOpenLikes: () => void;
  onOpenComments: () => void;
  showPinnedLabel?: boolean;
}

function formatHandleLine(handle: string, dataRelativa: string): string {
  const h = handle.startsWith('@') ? handle : `@${handle}`;
  const time = dataRelativa.replace(/^há\s+/i, '').trim() || dataRelativa;
  return `${h} · ${time}`;
}

export default function FeedNovidadeCardBody({
  item,
  imageCacheEpoch,
  canInteract,
  onOpenDetail,
  onLike,
  onOpenLikes,
  onOpenComments,
  showPinnedLabel = false,
}: FeedNovidadeCardBodyProps) {
  const { name: themeName } = useAppTheme();

  const displayName = useMemo(() => {
    const fromAuthor = feedPublisherDisplayName(item);
    if (fromAuthor && fromAuthor !== 'Prefeitura') return fromAuthor;
    const themed = themeName?.trim();
    if (themed && themed !== 'Default') {
      return themed.toLowerCase().includes('prefeitura') ? themed : `Prefeitura de ${themed}`;
    }
    return 'Prefeitura';
  }, [item, themeName]);

  const metaLine = useMemo(() => {
    if (item.isOfficial && (item.officialRole || item.officialInstitution)) {
      const role = item.officialRole?.trim();
      const institution = item.officialInstitution?.trim();
      const rolePart = [role, institution].filter(Boolean).join(' · ');
      return `${rolePart} · ${item.dataRelativa.replace(/^há\s+/i, '').trim() || item.dataRelativa}`;
    }
    return formatHandleLine(item.autorHandle, item.dataRelativa);
  }, [item]);

  const imageUri = useMemo(() => {
    if (!item.imagem) return null;
    return item.imagem.includes('?')
      ? `${item.imagem}&v=${imageCacheEpoch}`
      : `${item.imagem}?v=${imageCacheEpoch}`;
  }, [item.imagem, imageCacheEpoch]);

  const bodyText = useMemo(() => {
    const resumo = item.resumo?.replace(/\s+/g, ' ').trim() ?? '';
    const titulo = item.titulo?.replace(/\s+/g, ' ').trim() ?? '';
    if (resumo && titulo && resumo !== titulo && !resumo.startsWith(titulo)) {
      const sep = /[.!?…]$/.test(titulo) ? ' ' : '. ';
      return `${titulo}${sep}${resumo}`;
    }
    return resumo || titulo || '';
  }, [item.resumo, item.titulo]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onOpenDetail}
          style={({ pressed }) => [styles.headerLeft, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Abrir publicação: ${item.titulo}`}
        >
          <Image source={{ uri: item.autorAvatar }} style={styles.avatar} />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {displayName}
              </Text>
              {item.isOfficial ? (
                <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" />
              ) : null}
            </View>
            <Text style={styles.metaLine} numberOfLines={1}>
              {metaLine}
            </Text>
          </View>
        </Pressable>

        {showPinnedLabel ? (
          <View
            style={styles.pinnedLabel}
            accessibilityRole="text"
            accessibilityLabel="Fixado"
          >
            <MaterialIcons name="push-pin" size={13} color="#94a3b8" />
            <Text style={styles.pinnedLabelText}>Fixado</Text>
          </View>
        ) : (
          <Ionicons name="ellipsis-horizontal" size={18} color="#536471" />
        )}
      </View>

      {imageUri ? (
        <Pressable
          onPress={onOpenDetail}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Abrir publicação: ${item.titulo}`}
        >
          <FeedMedia
            uri={imageUri}
            contentType={item.imagemContentType}
            aspectRatio={4 / 5}
            style={styles.media}
          />
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.actionsRow}>
          <View style={styles.actionGroup}>
            <Pressable
              onPress={onLike}
              disabled={!canInteract}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={item.liked ? 'Descurtir' : 'Curtir'}
            >
              <Ionicons
                name={item.liked ? 'heart' : 'heart-outline'}
                size={26}
                color={item.liked ? '#e11d48' : '#0f172a'}
              />
            </Pressable>
            <Pressable
              onPress={onOpenLikes}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Ver curtidas"
            >
              <Text style={styles.likesText}>
                {item.curtidas === 1 ? '1 curtida' : `${item.curtidas} curtidas`}
              </Text>
            </Pressable>
          </View>
          <View style={styles.actionGroup}>
            <Pressable
              onPress={onOpenComments}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Ver comentários"
            >
              <Ionicons name="chatbubble-outline" size={24} color="#0f172a" />
            </Pressable>
            <Pressable
              onPress={onOpenComments}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Ver comentários"
            >
              <Text style={styles.likesText}>{formatComentariosLabel(item.comentarios)}</Text>
            </Pressable>
          </View>
        </View>

        {bodyText ? (
          <Pressable
            onPress={onOpenDetail}
            style={({ pressed }) => [pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Abrir publicação: ${item.titulo}`}
          >
            <Text style={styles.caption}>
              <Text style={styles.captionAuthor}>{displayName} </Text>
              {bodyText}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    backgroundColor: '#ffffff',
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
  metaLine: {
    fontSize: 12,
    color: '#64748b',
  },
  pinnedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinnedLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
  media: {
    alignSelf: 'stretch',
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
  pressed: {
    opacity: 0.72,
  },
});
