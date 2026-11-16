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
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface LostAnimalCardProps {
  item: LostAnimalDto;
  imageCacheEpoch: number;
  isOwner: boolean;
  onOpenDetail: () => void;
  onOpenActions: () => void;
}

export default function LostAnimalCard({
  item,
  imageCacheEpoch,
  isOwner,
  onOpenDetail,
  onOpenActions,
}: LostAnimalCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = lostAnimalImageSource(item, imageCacheEpoch);
  const canExpandImage = !!imageSource && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [item.id, item.mediaId, item.imageUrl, imageCacheEpoch]);

  const title = lostAnimalTitle(item);
  const isFound = isPetFound(item);
  const missingDateLabel = formatMissingDateLabel(item.missingDate, item.createdAt);
  const foundAtLabel = isFound ? formatFoundAtLabel(item.foundAt) : '';
  const contactLabel = formatContactDisplay(item.contact);
  const speciesLine = [item.species?.trim(), item.breed?.trim()].filter(Boolean).join(' • ');
  const commentsCount = Math.max(0, item.commentsCount ?? 0);

  return (
    <View style={[styles.card, isFound && styles.cardFound]}>
      <Pressable
        onPress={onOpenDetail}
        style={({ pressed }) => [styles.mainPress, pressed && styles.mainPressPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Ver perfil de ${title}`}
      >
        <View style={styles.mainRow}>
          {canExpandImage ? (
            <Image
              source={imageSource}
              style={styles.thumb}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
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

            {!isFound && missingDateLabel ? (
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

            {item.description?.trim() ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description.trim()}
              </Text>
            ) : null}

            {contactLabel ? (
              <View style={styles.contactBtn}>
                <Ionicons name="call-outline" size={16} color="#059669" />
                <Text style={styles.contactBtnText} numberOfLines={1}>
                  {contactLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <Pressable
          onPress={onOpenDetail}
          style={({ pressed }) => [styles.footerBtn, pressed && styles.footerBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`${commentsCount} comentários`}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
          <Text style={styles.footerCount}>{commentsCount}</Text>
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
  mainPress: {
    borderRadius: 10,
  },
  mainPressPressed: {
    opacity: 0.92,
  },
  mainRow: {
    flexDirection: 'row',
    gap: 12,
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
  description: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
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
});
