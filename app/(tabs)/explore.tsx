import MapaView from '@/components/MapaView';
import { AppColors } from '@/constants/theme';
import { Localizacao, PontoInteresse } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Coordenadas de Maricá, RJ
const MARICA_CENTER = {
  latitude: -22.9189,
  longitude: -42.8186,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function ExplorarScreen() {
  const [localizacao, setLocalizacao] = useState<Localizacao>(MARICA_CENTER);
  const [loading, setLoading] = useState<boolean>(true);
  const [tipoMapa, setTipoMapa] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [pontos, setPontos] = useState<PontoInteresse[]>([]);

  useEffect(() => {
    carregarPontos();
    if (Platform.OS !== 'web') {
      solicitarPermissaoLocalizacao();
    } else {
      setLoading(false);
    }
  }, []);

  const solicitarPermissaoLocalizacao = async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'A permissão de localização é necessária para mostrar sua posição no mapa.'
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocalizacao({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      // Usar localização padrão de Maricá
      setLocalizacao(MARICA_CENTER);
      setLoading(false);
    }
  };

  const carregarPontos = (): void => {
    // Pontos de interesse de Maricá
    const pontosSimulados: PontoInteresse[] = [
      {
        id: '1',
        titulo: 'Prefeitura Municipal de Maricá',
        descricao: 'Sede da administração municipal',
        latitude: -22.9189,
        longitude: -42.8186,
        tipo: 'governo',
      },
      {
        id: '2',
        titulo: 'Hospital Municipal de Maricá',
        descricao: 'Hospital público da cidade',
        latitude: -22.9150,
        longitude: -42.8150,
        tipo: 'saude',
      },
      {
        id: '3',
        titulo: 'Praia de Itaipuaçu',
        descricao: 'Uma das praias mais famosas de Maricá',
        latitude: -22.9300,
        longitude: -42.8300,
        tipo: 'turismo',
      },
      {
        id: '4',
        titulo: 'Lagoa de Araçatiba',
        descricao: 'Lagoa para atividades de lazer e esportes',
        latitude: -22.9100,
        longitude: -42.8100,
        tipo: 'lazer',
      },
      {
        id: '5',
        titulo: 'Centro Cultural de Maricá',
        descricao: 'Espaço para eventos e exposições culturais',
        latitude: -22.9200,
        longitude: -42.8200,
        tipo: 'cultura',
      },
      {
        id: '6',
        titulo: 'Escola Municipal',
        descricao: 'Escola pública de ensino fundamental',
        latitude: -22.9180,
        longitude: -42.8180,
        tipo: 'educacao',
      },
      {
        id: '7',
        titulo: 'Lagoa da Barra',
        descricao: 'Lagoa com área de lazer e pesca',
        latitude: -22.9250,
        longitude: -42.8250,
        tipo: 'turismo',
      },
      {
        id: '8',
        titulo: 'Praia de Ponta Negra',
        descricao: 'Praia paradisíaca de Maricá',
        latitude: -22.9350,
        longitude: -42.8350,
        tipo: 'turismo',
      },
    ];

    setPontos(pontosSimulados);
  };

  const getMarkerColor = (tipo: PontoInteresse['tipo']): string => {
    return AppColors.categoria[tipo] || AppColors.primary;
  };

  const alternarTipoMapa = (): void => {
    const tipos: Array<'standard' | 'satellite' | 'hybrid'> = ['standard', 'satellite', 'hybrid'];
    const indiceAtual = tipos.indexOf(tipoMapa);
    const proximoIndice = (indiceAtual + 1) % tipos.length;
    setTipoMapa(tipos[proximoIndice]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Carregando mapa de Maricá...</Text>
      </View>
    );
  }

  // Na web, mostrar uma lista de pontos de interesse
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.webContainer}>
          <View style={styles.webHeader}>
            <Ionicons name="compass-outline" size={32} color={AppColors.primary} />
            <Text style={styles.webTitle}>Pontos de Interesse - Maricá</Text>
            <Text style={styles.webSubtitle}>
              O mapa interativo está disponível apenas em dispositivos móveis.
              Use o app no celular para visualizar o mapa completo.
            </Text>
          </View>
          <View style={styles.pontosList}>
            {pontos.map((ponto) => (
              <View key={ponto.id} style={styles.pontoCard}>
                <View style={[styles.pontoIndicator, { backgroundColor: getMarkerColor(ponto.tipo) }]} />
                <View style={styles.pontoContent}>
                  <Text style={styles.pontoTitulo}>{ponto.titulo}</Text>
                  <Text style={styles.pontoDescricao}>{ponto.descricao}</Text>
                  <View style={styles.pontoCoords}>
                  <Ionicons name="location-outline" size={14} color={AppColors.text.tertiary} />
                    <Text style={styles.pontoCoordText}>
                      {ponto.latitude.toFixed(4)}, {ponto.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapaView
        localizacao={localizacao}
        tipoMapa={tipoMapa}
        pontos={pontos}
        getMarkerColor={getMarkerColor}
      />

      <View style={styles.controles}>
        <TouchableOpacity
          style={styles.botaoControle}
          onPress={alternarTipoMapa}
        >
          <Ionicons name="map-outline" size={24} color={AppColors.text.white} />
          <Text style={styles.botaoTexto}>
            {tipoMapa === 'standard' ? 'Satélite' :
             tipoMapa === 'satellite' ? 'Híbrido' : 'Padrão'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoControle}
          onPress={solicitarPermissaoLocalizacao}
        >
          <Ionicons name="locate" size={24} color={AppColors.text.white} />
          <Text style={styles.botaoTexto}>Minha Localização</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legenda}>
        <Text style={styles.legendaTitulo}>Legenda:</Text>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaCor, { backgroundColor: AppColors.categoria.governo }]} />
          <Text style={styles.legendaTexto}>Governo</Text>
        </View>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaCor, { backgroundColor: AppColors.categoria.saude }]} />
          <Text style={styles.legendaTexto}>Saúde</Text>
        </View>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaCor, { backgroundColor: AppColors.categoria.lazer }]} />
          <Text style={styles.legendaTexto}>Lazer</Text>
        </View>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaCor, { backgroundColor: AppColors.categoria.educacao }]} />
          <Text style={styles.legendaTexto}>Educação</Text>
        </View>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaCor, { backgroundColor: AppColors.categoria.cultura }]} />
          <Text style={styles.legendaTexto}>Cultura</Text>
        </View>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaCor, { backgroundColor: AppColors.categoria.turismo }]} />
          <Text style={styles.legendaTexto}>Turismo</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background.light,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.text.tertiary,
  },
  map: {
    width: width,
    height: height,
  },
  webContainer: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  webHeader: {
    backgroundColor: AppColors.background.default,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  pontosList: {
    padding: 16,
  },
  pontoCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pontoIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  pontoContent: {
    flex: 1,
  },
  pontoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  pontoDescricao: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    marginBottom: 8,
  },
  pontoCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pontoCoordText: {
    fontSize: 12,
    color: AppColors.text.quaternary,
  },
  controles: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
  },
  botaoControle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  botaoTexto: {
    color: AppColors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
  legenda: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: AppColors.background.default,
    padding: 12,
    borderRadius: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  legendaTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 8,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  legendaCor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendaTexto: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
});

