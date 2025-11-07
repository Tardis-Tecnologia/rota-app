import { AppColors } from '@/constants/theme';
import { FeedFilter, Post } from '@/types';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface NewsPostsProps {
  filter?: FeedFilter;
}

export default function NewsPosts({ filter = 'todos' }: NewsPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    carregarPosts();
  }, []);

  const carregarPosts = async (): Promise<void> => {
    setLoading(true);
    // Dados simulados com o novo formato
    const postsSimulados: Post[] = [
      {
        id: '1',
        autor: 'Prefeitura',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60',
        data: '2h',
        conteudo: 'É com grande alegria que inauguramos hoje o novo Parque da Cidade! Um espaço verde para o lazer de toda a família. Venham conhecer!',
        imagem: 'https://prefeitura.rio/wp-content/uploads/2024/09/53978222053_204a5d2291_k.jpg',
        curtidas: 45,
        comentarios: 12,
        compartilhamentos: 8,
        curtido: false,
        username: '@pref_cidade',
        tipo: 'post',
        categoria: 'noticias',
      },
      {
        id: '2',
        autor: 'Prefeitura',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60',
        data: '35 minutos',
        conteudo: '',
        imagem: 'https://s2-oglobo.glbimg.com/9AKpFWDtfebBsuW-yAl6AYQSA6s=/1200x/smart/filters:cover():strip_icc()/i.s3.glbimg.com/v1/AUTH_da025474c0c44edd99332dddb09cabe8/internal_photos/bs/2024/w/R/Yz1pkhSAe5DDiYjfM12A/whatsapp-image-2024-01-14-at-09.52.51.jpeg',
        curtidas: 0,
        comentarios: 0,
        compartilhamentos: 0,
        curtido: false,
        tipo: 'alerta',
        titulo: 'Alerta de Alagamento na Av. Brasil: Fortes chuvas causam pontos de alagamento.',
        categoria: 'obras',
      },
      {
        id: '3',
        autor: 'Prefeitura',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60',
        data: '8h',
        conteudo: '🚧 Obras de recapeamento na Rua das Flores começarão na próxima segunda-feira. Planeje seu trajeto com antecedência para evitar transtornos.',
        imagem: null,
        curtidas: 89,
        comentarios: 23,
        compartilhamentos: 15,
        curtido: true,
        username: '@pref_cidade',
        tipo: 'post',
        categoria: 'lazer',
      },
    ];

    setTimeout(() => {
      setPosts(postsSimulados);
      setLoading(false);
    }, 1000);
  };

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

  if (filteredPosts.length === 0) {
    return null;
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
});

