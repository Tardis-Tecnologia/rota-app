import { AppColors } from '@/constants/theme';
import { useSavedEvents } from '@/hooks/useSavedEvents';
import type { EventListItem } from '@/utils/eventPresentation';
import {
  formatListDateParts,
  formatLocationLine,
  getCategoryMeta,
  primaryCategoryKey,
} from '@/utils/eventPresentation';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type EventUpcomingCardProps = {
  item: EventListItem;
};

export default function EventUpcomingCard({ item }: EventUpcomingCardProps) {
  const { isSaved, toggleSaved } = useSavedEvents();
  const dateParts = formatListDateParts(item.startDateIso);
  const cat = getCategoryMeta(primaryCategoryKey(item));
  const saved = isSaved(item.id);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        router.push({
          pathname: '/evento/[id]',
          params: {
            id: item.id,
            ...(item.imagem ? { imageUri: item.imagem } : {}),
          },
        })
      }
    >
      <View style={styles.dateCol}>
        <Text style={styles.day}>{dateParts.day}</Text>
        <Text style={styles.month}>{dateParts.month}</Text>
        <Text style={styles.weekday}>{dateParts.weekday}</Text>
      </View>

      <View style={styles.imageWrap}>
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Pressable
          style={styles.bookmark}
          hitSlop={8}
          onPress={() => void toggleSaved(item)}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? AppColors.tab.active : AppColors.gray[500]}
          />
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {item.titulo}
        </Text>
        {item.horario ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={AppColors.gray[500]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.horario}
            </Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={AppColors.gray[500]} />
          <Text style={styles.metaText} numberOfLines={2}>
            {formatLocationLine(item)}
          </Text>
        </View>
        {item.featured ? (
          <Text style={styles.featuredHint}>Evento em destaque</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  cardPressed: {
    opacity: 0.94,
  },
  dateCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  day: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.tab.active,
    lineHeight: 24,
  },
  month: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.tab.active,
  },
  weekday: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.gray[500],
  },
  imageWrap: {
    width: 88,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: AppColors.gray[200],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: AppColors.gray[300],
  },
  catBadge: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  catText: {
    fontSize: 9,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  bookmark: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
    paddingRight: 28,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: AppColors.gray[500],
    flex: 1,
    lineHeight: 17,
  },
  featuredHint: {
    fontSize: 11,
    color: AppColors.tab.active,
    fontWeight: '700',
    marginTop: 4,
  },
});
