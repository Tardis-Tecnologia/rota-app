import { AppColors } from '@/constants/theme';
import { getEvents } from '@/services/eventsService';
import type { Evento } from '@/types';
import {
  eventItemToEvento,
  formatEventCardDateLine,
  startOfLocalDay,
} from '@/utils/eventsCarousel';
import { Feather } from '@expo/vector-icons';
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
const SIDE_PADDING = 24;
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

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
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.kicker}>AGENDA</Text>
          <Text style={styles.title}>Eventos na cidade</Text>
        </View>
        <Pressable
          hitSlop={8}
          style={styles.viewAllButton}
          onPress={() => router.push('/(tabs)/eventos')}
        >
          <Text style={styles.viewAllText}>Ver todos</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {eventos.map((evento, index) => (
          <TouchableOpacity
            key={evento.id}
            style={[
              styles.card,
              { width: CARD_WIDTH },
              index !== eventos.length - 1 && { marginRight: CARD_SPACING },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/evento/[id]',
                params: {
                  id: evento.id,
                  ...(evento.imagem ? { imageUri: evento.imagem } : {}),
                },
              })
            }
          >
            <View style={styles.imageWrap}>
              {evento.imagem && (
                <Image
                  source={{ uri: evento.imagem }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.dateBadge}>
                <Feather name="calendar" size={14} color={AppColors.tab.active} />
                <Text style={styles.dateBadgeText} numberOfLines={2}>
                  {formatEventCardDateLine(evento)}
                </Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.titulo} numberOfLines={2}>
                {evento.titulo}
              </Text>
              <View style={styles.locationRow}>
                <Feather
                  name="map-pin"
                  size={14}
                  color={AppColors.tab.active}
                  style={styles.locationIcon}
                />
                <Text style={styles.local} numberOfLines={1}>
                  {evento.local}
                </Text>
              </View>
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
  headerRow: {
    paddingHorizontal: SIDE_PADDING,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerLeft: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: AppColors.text.tertiary,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  carousel: {
    paddingHorizontal: SIDE_PADDING,
    paddingRight: SIDE_PADDING,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    flexShrink: 0,
  },
  imageWrap: {
    position: 'relative',
    backgroundColor: AppColors.gray[300],
  },
  cardImage: {
    width: '100%',
    height: 112, // h-28 = 112px
    backgroundColor: AppColors.gray[300],
  },
  dateBadge: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.text.secondary,
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 16,
  },
  cardContent: {
    padding: 16,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginTop: 4,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locationIcon: {
    marginTop: 1,
  },
  local: {
    fontSize: 14,
    color: AppColors.text.tertiary, // gray-500
    flexShrink: 1,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.tab.active,
  },
  viewAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 200, 0.35)',
    backgroundColor: 'rgba(0, 210, 200, 0.10)',
  },
});
