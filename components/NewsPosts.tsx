import { AppColors } from '@/constants/theme';
import { getNews, NEWS_FEED_TAG, newsItemToPost } from '@/services/newsApi';
import { FeedFilter, Post } from '@/types';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ListRenderItem,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface NewsPostsProps {
  filter?: FeedFilter;
  maxItems?: number;
  listHeader?: React.ReactNode;
}

export default function NewsPosts({ filter = 'todos', maxItems, listHeader }: NewsPostsProps) {
  const PAGE_SIZE = 10;
  const pageSize = maxItems ?? PAGE_SIZE;
  const isPreview = maxItems != null;
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const postsLengthRef = useRef(0);
  postsLengthRef.current = posts.length;

  const feedTag = useMemo(() => {
    if (filter === 'todos') return undefined;
    return NEWS_FEED_TAG[filter];
  }, [filter]);

  const fetchPage = useCallback(
    async (offset: number) => {
      return getNews({
        status: 'published',
        tag: feedTag,
        init: offset,
        end: offset + pageSize,
      });
    },
    [feedTag, pageSize],
  );

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchPage(0);
      const mapped: Post[] = list.map(newsItemToPost);
      setPosts(mapped);
      setHasMore(!isPreview && list.length === pageSize);
    } catch {
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, isPreview, pageSize]);

  const loadMorePosts = useCallback(async () => {
    if (isPreview || loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const offset = postsLengthRef.current;
      const list = await fetchPage(offset);
      const mapped: Post[] = list.map(newsItemToPost);
      setPosts((prev) => [...prev, ...mapped]);
      setHasMore(list.length === pageSize);
    } catch {
      /* falha silenciosa — lista já exibida */
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, isPreview, loading, loadingMore, pageSize]);

  const handleEndReached = useCallback(() => {
    if (isPreview || loadingMore || !hasMore || loading) return;
    void loadMorePosts();
  }, [isPreview, loadingMore, hasMore, loading, loadMorePosts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const renderPostCard = useCallback((post: Post) => {
    if (post.tipo === 'alerta') {
      return (
        <TouchableOpacity
          style={styles.alertCard}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Alertas', 'Detalhes disponíveis em breve.')}
        >
          {post.imagem && (
            <Image
              source={{ uri: post.imagem }}
              style={styles.alertImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.alertContent}>
            <Text style={styles.alertBadge}>ALERTA</Text>
            {post.titulo && (
              <Text style={styles.alertTitulo} numberOfLines={2}>
                {post.titulo}
              </Text>
            )}
            <Text style={styles.alertData}>Há {post.data}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: post.avatar }} style={styles.avatar} />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.autor}>{post.autor}</Text>
            <Text style={styles.data}>
              {post.username ? `${post.username} • ` : ''}{post.data.includes('Há') ? post.data : `Há ${post.data}`}
            </Text>
          </View>
        </View>

        <Text style={styles.conteudo}>
          {post.conteudo}
        </Text>

        {post.imagem && (
          <View style={styles.imagemContainer}>
            <Image
              source={{ uri: post.imagem }}
              style={styles.imagem}
              resizeMode="cover"
            />
          </View>
        )}
        {post.imagem && <View style={styles.divider} />}
        <View style={styles.postActions}>
          <View style={styles.actionItem}>
            <Feather name="message-circle" size={18} color={AppColors.text.tertiary} />
            <Text style={styles.actionText}>{post.comentarios}</Text>
          </View>

          <View style={styles.actionItem}>
            <Feather name="repeat" size={18} color={AppColors.text.tertiary} />
            <Text style={styles.actionText}>{post.compartilhamentos}</Text>
          </View>

          <View style={styles.actionItem}>
            <Feather
              name="heart"
              size={18}
              color={post.curtido ? AppColors.tab.active : AppColors.text.tertiary}
            />
            <Text style={styles.actionText}>{post.curtidas}</Text>
          </View>
          <View style={styles.actionItem}>
            <Feather
              name="share-2"
              size={18}
              color={AppColors.text.tertiary}
            />
          </View>
        </View>
      </View>
    );
  }, []);

  const renderItem: ListRenderItem<Post> = useCallback(
    ({ item }) => <View style={styles.feedItemWrap}>{renderPostCard(item)}</View>,
    [renderPostCard],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const renderListHeader = useCallback(() => {
    if (listHeader == null) return null;
    return <View style={styles.feedListHeaderOuter}>{listHeader}</View>;
  }, [listHeader]);

  const feedFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.feedFooterLoading}>
        <ActivityIndicator size="small" color={AppColors.primary} />
        <Text style={styles.feedFooterText}>Carregando…</Text>
      </View>
    );
  }, [loadingMore]);

  const feedEmpty = useMemo(() => {
    if (loading && !loadingMore) {
      return (
        <View style={styles.feedEmptyBlock}>
          <ActivityIndicator size="small" color={AppColors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.feedEmptyBlock}>
        <Text style={styles.emptyTitle}>Notícias não encontradas</Text>
        <Text style={styles.emptySubtitle}>
          Tente outro filtro, volte mais tarde ou puxe para atualizar.
        </Text>
      </View>
    );
  }, [loading, loadingMore]);

  if (isPreview) {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={AppColors.primary} />
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Notícias não encontradas</Text>
          <Text style={styles.emptySubtitle}>
            Tente outro filtro, volte mais tarde ou puxe para atualizar.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.postsContainer}>
          {posts.map((post) => (
            <View key={post.id}>{renderPostCard(post)}</View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.feedRoot}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={feedEmpty}
        ListFooterComponent={feedFooter}
        contentContainerStyle={styles.feedListContent}
        style={styles.feedList}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={{ height: 16 }} />;
}

const styles = StyleSheet.create({
  feedRoot: {
    flex: 1,
  },
  feedList: {
    flex: 1,
  },
  feedListContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  feedListHeaderOuter: {
    width: '100%',
    alignSelf: 'stretch',
  },
  feedItemWrap: {
    paddingHorizontal: 24,
  },
  feedFooterLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  feedFooterText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  feedEmptyBlock: {
    minHeight: 160,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  postsContainer: {
    gap: 16,
  },
  postCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray[300],
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  autor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  data: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  conteudo: {
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  imagemContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  alertCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  alertImage: {
    width: '100%',
    height: 160,
    backgroundColor: AppColors.gray[300],
  },
  alertContent: {
    padding: 16,
  },
  alertBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.tab.active,
    marginBottom: 4,
  },
  alertTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginTop: 4,
    marginBottom: 8,
  },
  alertData: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginTop: 12,
    marginBottom: 7,
    width: '100%',
  },
});
