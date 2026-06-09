import { AppColors } from '@/constants/theme';
import type { PontoInteresse } from '@/types';
import { Image } from 'expo-image';
import React, { memo, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export const MAP_POI_CARD_WIDTH = 88;
export const MAP_POI_CARD_HEIGHT = 118;

type MapPoiOverlayCardProps = {
  ponto: PontoInteresse;
  categoryLabel: string;
  onPress: (ponto: PontoInteresse) => void;
};

function markerInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function MapPoiOverlayCard({ ponto, categoryLabel, onPress }: MapPoiOverlayCardProps) {
  const initial = useMemo(() => markerInitial(ponto.titulo), [ponto.titulo]);
  const photoUrl = ponto.photoUrl?.trim();

  return (
    <Pressable
      onPress={() => onPress(ponto)}
      style={styles.card}
      collapsable={Platform.OS === 'android' ? false : undefined}
      accessibilityRole="button"
      accessibilityLabel={ponto.titulo}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.photo}
          contentFit="cover"
          recyclingKey={ponto.id}
          cachePolicy="memory-disk"
          transition={120}
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {ponto.titulo}
      </Text>
      <Text style={styles.category} numberOfLines={1} ellipsizeMode="tail">
        {categoryLabel}
      </Text>
      <View style={styles.pointer} />
    </Pressable>
  );
}

export default memo(
  MapPoiOverlayCard,
  (prev, next) =>
    prev.ponto.id === next.ponto.id &&
    prev.ponto.titulo === next.ponto.titulo &&
    prev.ponto.photoUrl === next.ponto.photoUrl &&
    prev.categoryLabel === next.categoryLabel,
);

const styles = StyleSheet.create({
  card: {
    width: MAP_POI_CARD_WIDTH,
    backgroundColor: AppColors.background.default,
    borderRadius: 14,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 12,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  photo: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: AppColors.gray[200],
  },
  photoPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  name: {
    marginTop: 8,
    width: '100%',
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'left',
  },
  category: {
    marginTop: 2,
    width: '100%',
    fontSize: 10,
    fontWeight: '500',
    color: AppColors.text.tertiary,
    textAlign: 'left',
  },
  pointer: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: AppColors.background.default,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
});
