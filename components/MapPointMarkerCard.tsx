import { AppColors } from '@/constants/theme';
import type { PontoInteresse } from '@/types';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type MapPointMarkerCardProps = {
  ponto: PontoInteresse;
};

const CARD_WIDTH = 76;
const CARD_PADDING = 5;
const AVATAR_HEIGHT = 48;

function markerInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export default function MapPointMarkerCard({ ponto }: MapPointMarkerCardProps) {
  const initial = useMemo(() => markerInitial(ponto.titulo), [ponto.titulo]);

  return (
    <View style={styles.wrap} collapsable={false}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
        <Text style={styles.label} numberOfLines={2} ellipsizeMode="tail">
          {ponto.titulo}
        </Text>
      </View>
      <View style={styles.pointer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.background.default,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    padding: CARD_PADDING,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: CARD_WIDTH - CARD_PADDING * 2,
    height: AVATAR_HEIGHT,
    borderRadius: 7,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  label: {
    marginTop: 4,
    paddingHorizontal: 1,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  pointer: {
    width: 8,
    height: 4,
    marginTop: 2,
    borderRadius: 1,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
});
