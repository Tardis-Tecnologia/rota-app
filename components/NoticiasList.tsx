import { AppColors } from '@/constants/theme';
import { Noticia } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NoticiasListProps {
  onRefresh?: () => void;
  renderAsItems?: boolean; // Se true, retorna apenas os itens renderizados
}

export default function NoticiasList({ onRefresh, renderAsItems = false }: NoticiasListProps) {
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    carregarNoticias();
  }, []);

  const carregarNoticias = async (): Promise<void> => {
    setLoading(true);
    // Dados simulados da Prefeitura de Maricá com imagens reais
    const noticiasSimuladas: Noticia[] = [
      {
        id: '1',
        titulo: 'Prefeitura de Maricá anuncia novas obras de infraestrutura',
        resumo: 'Investimento de R$ 10 milhões será destinado para melhorias em ruas e avenidas dos principais bairros da cidade...',
        imagem: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=400&fit=crop',
        data: '15 de Janeiro, 2024',
        categoria: 'Infraestrutura',
      },
      {
        id: '2',
        titulo: 'Programa de saúde ganha novos postos em Maricá',
        resumo: 'Três novos postos de saúde serão inaugurados este mês para melhorar o atendimento na região...',
        imagem: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
        data: '14 de Janeiro, 2024',
        categoria: 'Saúde',
      },
      {
        id: '3',
        titulo: 'Festival de Verão de Maricá acontece neste fim de semana',
        resumo: 'Evento contará com apresentações musicais na orla, feira de artesanato e comidas típicas...',
        imagem: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop',
        data: '13 de Janeiro, 2024',
        categoria: 'Turismo',
      },
      {
        id: '4',
        titulo: 'Novas vagas para cursos profissionalizantes em Maricá',
        resumo: 'Inscrições abertas para cursos gratuitos na área de turismo, tecnologia e sustentabilidade...',
        imagem: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
        data: '12 de Janeiro, 2024',
        categoria: 'Educação',
      },
      {
        id: '5',
        titulo: 'Maricá investe em sustentabilidade com novos projetos ambientais',
        resumo: 'Programa de preservação das lagoas e praias recebe investimento de R$ 3 milhões...',
        imagem: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        data: '11 de Janeiro, 2024',
        categoria: 'Meio Ambiente',
      },
      {
        id: '6',
        titulo: 'Centro Esportivo de Maricá será inaugurado em fevereiro',
        resumo: 'Novo espaço contará com quadras, piscina e área de ginástica para toda a população...',
        imagem: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        data: '10 de Janeiro, 2024',
        categoria: 'Esporte',
      },
    ];

    setTimeout(() => {
      setNoticias(noticiasSimuladas);
      setLoading(false);
    }, 1000);
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await carregarNoticias();
    if (onRefresh) {
      onRefresh();
    }
    setRefreshing(false);
  };

  const renderNoticia: ListRenderItem<Noticia> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/noticia/${item.id}`)}
    >
      <Image source={{ uri: item.imagem }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.categoriaContainer}>
          <Text style={styles.categoria}>{item.categoria}</Text>
        </View>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.resumo} numberOfLines={2}>{item.resumo}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.dataContainer}>
            <Ionicons name="calendar-outline" size={14} color={AppColors.text.tertiary} />
            <Text style={styles.data}>{item.data}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={AppColors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  // Se renderAsItems, retorna apenas os itens renderizados
  if (renderAsItems) {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      );
    }
    
    if (noticias.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={64} color={AppColors.gray[400]} />
          <Text style={styles.emptyText}>Nenhuma notícia disponível</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.itemsContainer}>
        {noticias.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/(tabs)/noticia/${item.id}`)}
          >
            <Image source={{ uri: item.imagem }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <View style={styles.categoriaContainer}>
                <Text style={styles.categoria}>{item.categoria}</Text>
              </View>
              <Text style={styles.titulo}>{item.titulo}</Text>
              <Text style={styles.resumo} numberOfLines={2}>{item.resumo}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.dataContainer}>
                  <Ionicons name="calendar-outline" size={14} color={AppColors.text.tertiary} />
                  <Text style={styles.data}>{item.data}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={AppColors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Comportamento padrão: retorna FlatList completa
  return (
    <View style={styles.container}>
      <FlatList
        data={noticias}
        renderItem={renderNoticia}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color={AppColors.gray[400]} />
            <Text style={styles.emptyText}>Nenhuma notícia disponível</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  itemsContainer: {
    padding: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: AppColors.gray[300],
  },
  cardContent: {
    padding: 16,
  },
  categoriaContainer: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoria: {
    color: AppColors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 8,
  },
  resumo: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  data: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.text.quaternary,
    marginTop: 16,
  },
});

