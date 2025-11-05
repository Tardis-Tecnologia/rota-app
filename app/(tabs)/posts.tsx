import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types';

export default function PostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');

  useEffect(() => {
    carregarPosts();
  }, []);

  const carregarPosts = async (): Promise<void> => {
    setLoading(true);
    // Dados simulados da Prefeitura de Maricá com imagens reais
    const postsSimulados: Post[] = [
      {
        id: '1',
        autor: 'Prefeitura de Maricá',
        avatar: 'https://images.unsplash.com/photo-1573164713714-95f53d3d0e96?w=100&h=100&fit=crop',
        data: 'Há 2 horas',
        conteudo: 'A Prefeitura de Maricá está realizando melhorias na infraestrutura urbana. Novos projetos de pavimentação começam esta semana na região central! 🚧',
        imagem: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=400&fit=crop',
        curtidas: 45,
        comentarios: 12,
        compartilhamentos: 8,
        curtido: false,
      },
      {
        id: '2',
        autor: 'Secretaria de Educação de Maricá',
        avatar: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&h=100&fit=crop',
        data: 'Há 5 horas',
        conteudo: 'Inscrições abertas para cursos profissionalizantes gratuitos! Não perca essa oportunidade. Cursos focados em turismo, tecnologia e sustentabilidade. 📚',
        imagem: null,
        curtidas: 89,
        comentarios: 23,
        compartilhamentos: 15,
        curtido: true,
      },
      {
        id: '3',
        autor: 'Secretaria de Saúde de Maricá',
        avatar: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=100&h=100&fit=crop',
        data: 'Há 1 dia',
        conteudo: 'Campanha de vacinação contra gripe continua em todos os postos de saúde da cidade. Traga sua carteira de vacinação! 💉',
        imagem: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
        curtidas: 156,
        comentarios: 34,
        compartilhamentos: 42,
        curtido: false,
      },
      {
        id: '4',
        autor: 'Prefeitura de Maricá',
        avatar: 'https://images.unsplash.com/photo-1573164713714-95f53d3d0e96?w=100&h=100&fit=crop',
        data: 'Há 2 dias',
        conteudo: 'Parabéns aos participantes da Caminhada pela Saúde na Lagoa de Araçatiba! Mais de 500 pessoas participaram do evento. 👏',
        imagem: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        curtidas: 203,
        comentarios: 56,
        compartilhamentos: 67,
        curtido: true,
      },
      {
        id: '5',
        autor: 'Secretaria de Turismo de Maricá',
        avatar: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&h=100&fit=crop',
        data: 'Há 3 dias',
        conteudo: 'Venha conhecer as belezas de Maricá! A cidade oferece praias paradisíacas, lagoas cristalinas e muito mais. 🌊',
        imagem: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop',
        curtidas: 312,
        comentarios: 78,
        compartilhamentos: 124,
        curtido: false,
      },
      {
        id: '6',
        autor: 'Secretaria de Esportes de Maricá',
        avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
        data: 'Há 4 dias',
        conteudo: 'Inauguração do novo Centro Esportivo está chegando! Em breve teremos um espaço completo para atividades físicas. 🏃‍♂️',
        imagem: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        curtidas: 189,
        comentarios: 45,
        compartilhamentos: 89,
        curtido: false,
      },
    ];

    setTimeout(() => {
      setPosts(postsSimulados);
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await carregarPosts();
    setRefreshing(false);
  };

  const toggleCurtida = (id: string): void => {
    setPosts(posts.map(post =>
      post.id === id
        ? { ...post, curtido: !post.curtido, curtidas: post.curtido ? post.curtidas - 1 : post.curtidas + 1 }
        : post
    ));
  };

  const postsFiltrados = posts.filter(post =>
    post.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
    post.autor.toLowerCase().includes(busca.toLowerCase())
  );

  const renderPost: ListRenderItem<Post> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.autor}>{item.autor}</Text>
          <Text style={styles.data}>{item.data}</Text>
        </View>
      </View>

      <Text style={styles.conteudo}>{item.conteudo}</Text>

      {item.imagem && (
        <Image source={{ uri: item.imagem }} style={styles.imagem} />
      )}

      <View style={styles.acoes}>
        <TouchableOpacity
          style={styles.acao}
          onPress={() => toggleCurtida(item.id)}
        >
          <Ionicons
            name={item.curtido ? "heart" : "heart-outline"}
            size={24}
            color={item.curtido ? "#E74C3C" : "#666"}
          />
          <Text style={[styles.acaoTexto, item.curtido && styles.acaoTextoAtivo]}>
            {item.curtidas}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.acao}>
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.acaoTexto}>{item.comentarios}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.acao}>
          <Ionicons name="share-outline" size={24} color="#666" />
          <Text style={styles.acaoTexto}>{item.compartilhamentos}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buscaContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.buscaIcon} />
        <TextInput
          style={styles.busca}
          placeholder="Buscar posts..."
          value={busca}
          onChangeText={setBusca}
          placeholderTextColor="#999"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={postsFiltrados}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {busca ? 'Nenhum post encontrado' : 'Nenhum post disponível'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  buscaIcon: {
    marginRight: 4,
  },
  busca: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  autor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  data: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  conteudo: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  imagem: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  acoes: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 12,
  },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6,
  },
  acaoTexto: {
    fontSize: 14,
    color: '#666',
  },
  acaoTextoAtivo: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

