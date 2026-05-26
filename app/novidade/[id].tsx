import { FEED_CATEGORIA_THEME, FEED_TIPO_THEME } from '@/constants/feedNovidadeTheme';
import { AppColors } from '@/constants/theme';
import { getNewsById, newsItemToNovidade } from '@/services/newsApi';
import type { FeedNovidade } from '@/types/feedNovidade';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NovidadeDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const newsId = String(params.id ?? '').trim();

  const [item, setItem] = useState<FeedNovidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!newsId) {
      setError('Novidade inválida.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await getNewsById(newsId);
      if (!raw) {
        setError('Comunicado não encontrado ou indisponível.');
        setItem(null);
      } else {
        setItem(newsItemToNovidade(raw));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o comunicado.');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.centerText}>Carregando comunicado…</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={44} color={AppColors.text.quaternary} />
        <Text style={styles.errorText}>{error ?? 'Comunicado indisponível.'}</Text>
      </View>
    );
  }

  const catTheme = FEED_CATEGORIA_THEME[item.categoria];
  const tipoTheme = FEED_TIPO_THEME[item.tipoNovidade];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {item.imagem ? (
        <Image source={{ uri: item.imagem }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['#1e40af', '#2563eb', '#0891b2']}
          style={styles.heroPlaceholder}
        >
          <Ionicons name={tipoTheme.icon} size={48} color="#fff" />
        </LinearGradient>
      )}

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <View style={[styles.tipoBadge, { backgroundColor: tipoTheme.bg }]}>
            <Ionicons name={tipoTheme.icon} size={14} color={tipoTheme.color} />
            <Text style={[styles.tipoBadgeText, { color: tipoTheme.color }]}>{item.tipoLabel}</Text>
          </View>
          <View style={[styles.catBadge, { backgroundColor: catTheme.bg }]}>
            <Text style={[styles.catBadgeText, { color: catTheme.color }]}>{item.categoriaLabel}</Text>
          </View>
        </View>

        <View style={styles.officialBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#1d4ed8" />
          <Text style={styles.officialBannerText}>Publicação oficial da Prefeitura</Text>
        </View>

        <Text style={styles.date}>{item.dataFormatada}</Text>
        {item.dataRelativa ? <Text style={styles.dateMuted}>{item.dataRelativa}</Text> : null}

        <Text style={styles.title}>{item.titulo}</Text>

        <Text style={styles.content}>{item.conteudo}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
    backgroundColor: AppColors.background.default,
  },
  centerText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  heroImage: {
    width: '100%',
    height: 240,
    backgroundColor: AppColors.gray[200],
  },
  heroPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tipoBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  officialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  officialBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginTop: 4,
  },
  dateMuted: {
    fontSize: 13,
    color: AppColors.text.quaternary,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: AppColors.text.secondary,
    lineHeight: 32,
    marginTop: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    color: AppColors.text.tertiary,
    marginTop: 8,
  },
});
