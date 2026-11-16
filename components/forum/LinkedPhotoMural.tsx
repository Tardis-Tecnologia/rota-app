import { forumPostImageUrl } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { listForumPosts, type ForumPostListItemDto } from '@/services/forumApi';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type LinkedPhotoMuralProps = {
  eventId?: string;
  commercialAccountId?: string;
  hostId?: string | null;
};

function photoUri(post: ForumPostListItemDto): string | null {
  const type = post.mediaContentType?.trim() ?? '';
  if (type.startsWith('video/')) return null;
  const direct = post.mediaPublicUrl?.trim();
  if (direct) return direct;
  return forumPostImageUrl(post.mediaId);
}

export default function LinkedPhotoMural({
  eventId,
  commercialAccountId,
  hostId,
}: LinkedPhotoMuralProps) {
  const [photos, setPhotos] = useState<{ id: string; uri: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!eventId && !commercialAccountId) {
        setPhotos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const rows = await listForumPosts(hostId ?? undefined, {
          eventId,
          commercialAccountId,
          init: 0,
          end: 40,
        });
        if (cancelled) return;
        setPhotos(
          rows
            .map((row) => {
              const uri = photoUri(row);
              return uri ? { id: row.id, uri } : null;
            })
            .filter((row): row is { id: string; uri: string } => row != null),
        );
      } catch {
        if (!cancelled) setPhotos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [commercialAccountId, eventId, hostId]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Ionicons name="images-outline" size={18} color={AppColors.tab.active} />
        <Text style={styles.title}>Mural</Text>
      </View>
      {loading ? <ActivityIndicator color={AppColors.tab.active} /> : null}
      {!loading && photos.length === 0 ? (
        <Text style={styles.empty}>
          As fotos marcadas nas publicações do feed aparecem aqui.
        </Text>
      ) : null}
      {!loading && photos.length > 0 ? (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Pressable key={photo.id} onPress={() => setPreview(photo.uri)} style={styles.cell}>
              <Image source={{ uri: photo.uri }} style={styles.image} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      ) : null}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.preview} onPress={() => setPreview(null)}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.previewImage} contentFit="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  empty: { fontSize: 14, lineHeight: 20, color: AppColors.text.tertiary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  image: { width: '100%', height: '100%', backgroundColor: '#e2e8f0' },
  preview: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    padding: 16,
  },
  previewImage: { width: '100%', height: '80%' },
});
