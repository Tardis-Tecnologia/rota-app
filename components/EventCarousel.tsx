import { AppColors } from '@/constants/theme';
import { Evento } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 240; // w-60 = 240px

export default function EventCarousel() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async (): Promise<void> => {
    setLoading(true);
    // Dados simulados com o novo formato
    const eventosSimulados: Evento[] = [
      {
        id: '1',
        titulo: 'Feira de Artesanato Local',
        data: 'Hoje',
        horario: '10:00 - 18:00',
        local: 'Praça da Matriz',
        descricao: 'Feira de Artesanato Local',
        tipo: 'Cultura',
        imagem: 'https://maceio.al.gov.br/transform/imagens/_850x560_crop_center-center_none/10-12-24-6a-Feira-Itinerante-Economia-Solidaria-SEMSC-Foto-Alisson-Frazao-10.jpg',
      },
      {
        id: '2',
        titulo: 'Show de Rock no Parque',
        data: 'Sábado',
        horario: '20:00',
        local: 'Parque da Cidade',
        descricao: 'Show de Rock no Parque',
        tipo: 'Cultura',
        imagem: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=500&auto=format&fit=crop&q=60',
      },
      {
        id: '3',
        titulo: 'Festival Gastronômico',
        data: 'Todo o fim de semana',
        horario: '',
        local: 'Orla da Praia',
        descricao: 'Festival Gastronômico',
        tipo: 'Turismo',
        imagem: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=60',
      },
      {
        id: '4',
        titulo: 'Cinema ao Ar Livre',
        data: 'Sexta',
        horario: '19:30',
        local: 'Anfiteatro Municipal',
        descricao: 'Cinema ao Ar Livre',
        tipo: 'Cultura',
        imagem: 'https://expresso.estadao.com.br/sao-paulo/wp-content/uploads/2023/03/cine-pinheios-2.jpg',
      },
    ];

    setTimeout(() => {
      setEventos(eventosSimulados);
      setLoading(false);
    }, 1000);
  };

  const formatarDataHorario = (evento: Evento): string => {
    let texto = '';
    if (evento.horario) {
      texto = `${evento.data}, ${evento.horario}`;
    } else {
      texto = evento.data;
    }
    return texto.toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={AppColors.primary} />
      </View>
    );
  }

  if (eventos.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos da Cidade</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        pagingEnabled
      >
        {eventos.map((evento) => (
          <TouchableOpacity
            key={evento.id}
            style={[styles.card, { width: CARD_WIDTH }]}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/',
                params: { id: evento.id },
              })
            }
          >
            {evento.imagem && (
              <Image 
                source={{ uri: evento.imagem }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.dataHorario}>
                {formatarDataHorario(evento)}
              </Text>
              <Text style={styles.titulo} numberOfLines={2}>
                {evento.titulo}
              </Text>
              <Text style={styles.local} numberOfLines={1}>
                {evento.local}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  carousel: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    flexShrink: 0,
  },
  cardImage: {
    width: '100%',
    height: 112, // h-28 = 112px
    backgroundColor: AppColors.gray[300],
  },
  cardContent: {
    padding: 16,
  },
  dataHorario: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.tab.active, // cyan-600
    marginBottom: 4,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginTop: 4,
    marginBottom: 4,
  },
  local: {
    fontSize: 14,
    color: AppColors.text.tertiary, // gray-500
  },
});

