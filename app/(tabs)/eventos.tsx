import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Evento } from '@/types';

export default function EventosScreen() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async (): Promise<void> => {
    setLoading(true);
    // Dados simulados da Prefeitura de Maricá
    const eventosSimulados: Evento[] = [
      {
        id: '1',
        titulo: 'Festival de Verão de Maricá',
        data: '20 de Janeiro, 2024',
        horario: '14:00 - 22:00',
        local: 'Orla de Itaipuaçu',
        descricao: 'Festival com apresentações culturais, comidas típicas e artesanato local na orla da cidade.',
        tipo: 'Turismo',
      },
      {
        id: '2',
        titulo: 'Feira de Saúde e Bem-estar',
        data: '25 de Janeiro, 2024',
        horario: '08:00 - 17:00',
        local: 'Ginásio Municipal de Maricá',
        descricao: 'Exames gratuitos, vacinação e orientações sobre saúde para toda a população.',
        tipo: 'Saúde',
      },
      {
        id: '3',
        titulo: 'Workshop de Empreendedorismo',
        data: '27 de Janeiro, 2024',
        horario: '09:00 - 12:00',
        local: 'Centro de Convenções de Maricá',
        descricao: 'Palestras e oficinas para empreendedores e pequenos negócios da região.',
        tipo: 'Educação',
      },
      {
        id: '4',
        titulo: 'Caminhada Ecológica na Lagoa de Araçatiba',
        data: '28 de Janeiro, 2024',
        horario: '07:00 - 10:00',
        local: 'Lagoa de Araçatiba',
        descricao: 'Caminhada ecológica com conscientização ambiental na bela lagoa de Araçatiba.',
        tipo: 'Meio Ambiente',
      },
      {
        id: '5',
        titulo: 'Festival de Música na Praia',
        data: '02 de Fevereiro, 2024',
        horario: '18:00 - 23:00',
        local: 'Praia de Itaipuaçu',
        descricao: 'Show com artistas locais e nacionais na praia mais famosa de Maricá.',
        tipo: 'Cultura',
      },
    ];

    setTimeout(() => {
      setEventos(eventosSimulados);
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await carregarEventos();
    setRefreshing(false);
  };

  const getTipoColor = (tipo: Evento['tipo']): string => {
    const cores: Record<Evento['tipo'], string> = {
      'Cultura': '#9B59B6',
      'Saúde': '#E74C3C',
      'Educação': '#3498DB',
      'Meio Ambiente': '#27AE60',
      'Esporte': '#F39C12',
      'Turismo': '#1ABC9C',
    };
    return cores[tipo] || '#0066CC';
  };

  const renderEvento: ListRenderItem<Evento> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/evento/${item.id}`)}
    >
      <LinearGradient
        colors={[getTipoColor(item.tipo), getTipoColor(item.tipo) + '80']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.tipoContainer}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.tipo}>{item.tipo}</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.cardContent}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.descricao} numberOfLines={2}>{item.descricao}</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color="#0066CC" />
            <Text style={styles.infoText}>{item.data}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#0066CC" />
            <Text style={styles.infoText}>{item.horario}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={16} color="#0066CC" />
            <Text style={styles.infoText}>{item.local}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.botaoSaibaMais}>
          <Text style={styles.botaoTexto}>Saiba Mais</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
      <FlatList
        data={eventos}
        renderItem={renderEvento}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum evento disponível</Text>
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
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientHeader: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descricao: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  botaoSaibaMais: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
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

