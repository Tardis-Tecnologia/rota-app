import { AppColors } from '@/constants/theme';
import { FeedFilter, Post } from '@/types';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getNews, newsItemToPost } from '@/services/newsApi';

interface NewsPostsProps {
  filter?: FeedFilter;
}

export default function NewsPosts({ filter = 'todos' }: NewsPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const carregarPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getNews();
      const mapped: Post[] = list.map(newsItemToPost);
      setPosts(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Não foi possível carregar as notícias.';
      setError(message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPosts();
  }, [carregarPosts]);

  const filteredPosts = useMemo(() => {
    if (filter === 'todos') {
      return posts;
    }
    return posts.filter((post) => post.categoria === filter);
  }, [filter, posts]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={AppColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => carregarPosts()} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma notícia no momento.</Text>
      </View>
    );
  }

  const renderPostCard = (post: Post) => {
    if (post.tipo === 'alerta') {
      return (
        <TouchableOpacity
          key={post.id}
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

    // Card tipo post normal
    return (
      <View key={post.id} style={styles.postCard}>
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.postsContainer}>
        {filteredPosts.map((post) => renderPostCard(post))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    minHeight: 120,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.status.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: AppColors.gray[500],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 16,
  },
  postsContainer: {
    gap: 16,
  },
  // Card tipo post normal
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
    aspectRatio: 16 / 9, // aspect-video
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
  // Card tipo alerta
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
    height: 160, // h-40 = 160px
    backgroundColor: AppColors.gray[300],
  },
  alertContent: {
    padding: 16,
  },
  alertBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.tab.active, // cyan-600
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

