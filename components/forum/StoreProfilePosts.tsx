import { forumPostImageUrl } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { listForumPosts, type ForumPostListItemDto } from '@/services/forumApi';
import { listMarketplaceListings } from '@/services/marketplaceApi';
import type { MarketplaceListing } from '@/types/marketplace';
import { formatMarketplacePrice } from '@/utils/marketplaceFormat';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type StoreProfilePostsProps = {
  commercialAccountId: string;
};

type PostRow = {
  key: string;
  title: string;
  meta: string;
  imageUri: string | null;
  onPress: () => void;
};

function postImage(post: ForumPostListItemDto): string | null {
  const direct = post.mediaPublicUrl?.trim();
  if (direct) return direct;
  return forumPostImageUrl(post.mediaId);
}

async function loadStoreProducts(commercialAccountId: string): Promise<MarketplaceListing[]> {
  const id = commercialAccountId.trim();
  try {
    const rows = await listMarketplaceListings({
      commercialAccountId: id,
      init: 0,
      end: 50,
    });
    return rows.filter((row) => !row.sellerId || row.sellerId === id);
  } catch {
    const rows = await listMarketplaceListings({ init: 0, end: 50 });
    return rows.filter((row) => row.sellerId === id);
  }
}

export default function StoreProfilePosts({ commercialAccountId }: StoreProfilePostsProps) {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const id = commercialAccountId.trim();
      if (!id) {
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [productsResult, postsResult] = await Promise.allSettled([
        loadStoreProducts(id),
        listForumPosts(undefined, { commercialAccountId: id, init: 0, end: 40 }),
      ]);
      if (cancelled) return;

      const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
      const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
      const next: PostRow[] = [
        ...products.map((item) => ({
          key: `product-${item.id}`,
          title: item.title,
          meta: `Produto · ${formatMarketplacePrice(item.price)}`,
          imageUri: item.imageUri,
          onPress: () => {
            router.push({ pathname: '/marketplace/[id]', params: { id: item.id } });
          },
        })),
        ...posts.map((post) => ({
          key: `post-${post.id}`,
          title: post.title?.trim() || 'Publicação',
          meta: 'Publicação',
          imageUri: postImage(post),
          onPress: () => {
            router.push('/(tabs)/forum');
          },
        })),
      ];
      setRows(next);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [commercialAccountId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Produtos/Serviços</Text>
      {loading ? <ActivityIndicator color="#0d9488" /> : null}
      {!loading && rows.length === 0 ? (
        <Text style={styles.empty}>Esta loja ainda não publicou produtos nem serviços.</Text>
      ) : null}
      {!loading
        ? rows.map((row) => (
            <Pressable
              key={row.key}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={row.onPress}
              accessibilityRole="button"
              accessibilityLabel={row.title}
            >
              {row.imageUri ? (
                <Image source={{ uri: row.imageUri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={styles.thumbFallback}>
                  <Ionicons name="image-outline" size={18} color="#94a3b8" />
                </View>
              )}
              <View style={styles.textWrap}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {row.title}
                </Text>
                <Text style={styles.rowMeta}>{row.meta}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </Pressable>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  empty: { fontSize: 14, lineHeight: 20, color: AppColors.text.tertiary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowPressed: { opacity: 0.85 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  thumbFallback: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  rowMeta: { fontSize: 13, fontWeight: '600', color: '#0d9488' },
});
