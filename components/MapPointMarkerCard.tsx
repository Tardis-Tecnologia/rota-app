import { AppColors } from '@/constants/theme';
import type { PontoInteresse } from '@/types';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type MapPointMarkerCardProps = {
  ponto: PontoInteresse;
};

const CARD_WIDTH = 124;
const CARD_PADDING = 12;
const AVATAR_HEIGHT = 76;

function markerInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export default function MapPointMarkerCard({ ponto }: MapPointMarkerCardProps) {
  const initial = useMemo(() => markerInitial(ponto.titulo), [ponto.titulo]);

  return (
    <View
      style={styles.wrap}
      collapsable={Platform.OS === 'android' ? false : undefined}
    >
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
    minHeight: CARD_PADDING * 2 + AVATAR_HEIGHT + 48,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    padding: CARD_PADDING,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: CARD_WIDTH - CARD_PADDING * 2,
    height: AVATAR_HEIGHT,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 38,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  label: {
    marginTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  pointer: {
    width: 16,
    height: 8,
    marginTop: 4,
    borderRadius: 2,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
});
