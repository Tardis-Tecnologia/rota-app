import { FEED_CATEGORIA_THEME, FEED_TIPO_THEME } from '@/constants/feedNovidadeTheme';
import { AppColors } from '@/constants/theme';
import type { FeedNovidade } from '@/types/feedNovidade';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface FeedNovidadeCardProps {
  item: FeedNovidade;
  imageCacheEpoch: number;
  onOpenDetail: () => void;
}

export default function FeedNovidadeCard({
  item,
  imageCacheEpoch,
  onOpenDetail,
}: FeedNovidadeCardProps) {
  const catTheme = FEED_CATEGORIA_THEME[item.categoria];
  const tipoTheme = FEED_TIPO_THEME[item.tipoNovidade];

  const imageUri = useMemo(() => {
    if (!item.imagem) return null;
    return item.imagem.includes('?')
      ? `${item.imagem}&v=${imageCacheEpoch}`
      : `${item.imagem}?v=${imageCacheEpoch}`;
  }, [item.imagem, imageCacheEpoch]);

  return (
    <Pressable
      onPress={onOpenDetail}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir novidade: ${item.titulo}`}
    >
      <View style={styles.metaTop}>
        <View style={[styles.tipoBadge, { backgroundColor: tipoTheme.bg }]}>
          <Ionicons name={tipoTheme.icon} size={12} color={tipoTheme.color} />
          <Text style={[styles.tipoBadgeText, { color: tipoTheme.color }]}>{item.tipoLabel}</Text>
        </View>
        <View style={[styles.catBadge, { backgroundColor: catTheme.bg }]}>
          <Ionicons name={catTheme.icon} size={12} color={catTheme.color} />
          <Text style={[styles.catBadgeText, { color: catTheme.color }]}>
            {item.categoriaLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.headline} numberOfLines={3}>
        {item.titulo}
      </Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.heroPlaceholder}>
          <Ionicons name={tipoTheme.icon} size={36} color="rgba(255,255,255,0.92)" />
        </LinearGradient>
      )}

      <Text style={styles.lead} numberOfLines={4}>
        {item.resumo}
      </Text>

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={AppColors.text.tertiary} />
        <Text style={styles.dateLine}>
          {item.dataFormatada}
          {item.dataRelativa ? ` · ${item.dataRelativa}` : ''}
        </Text>
      </View>

      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>Ler comunicado completo</Text>
        <Ionicons name="chevron-forward" size={18} color="#2563eb" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.96 },
  metaTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tipoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headline: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    color: '#0f172a',
    marginBottom: 12,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: AppColors.gray[200],
  },
  heroPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    color: '#475569',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateLine: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
});
