import { AppColors } from '@/constants/theme';
import { getEvents } from '@/services/eventsService';
import type { Evento } from '@/types';
import {
  eventItemToEvento,
  formatEventCardDateLine,
  startOfLocalDay,
} from '@/utils/eventsCarousel';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CARD_WIDTH = 240;

export default function EventCarousel() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const carregarEventos = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const items = await getEvents({
        init: 0,
        end: 12,
        featured: true,
        startDate: startOfLocalDay().toISOString(),
      });
      setEventos(items.map(eventItemToEvento));
    } catch {
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

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
        <Pressable
          hitSlop={8}
          style={styles.viewAllButton}
          onPress={() => router.push('/eventos')}
        >
          <Text style={styles.viewAllText}>Ver todos</Text>
        </Pressable>
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
                {formatEventCardDateLine(evento)}
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
    paddingBottom: 8,
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
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.accent,
  },
  viewAllButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
