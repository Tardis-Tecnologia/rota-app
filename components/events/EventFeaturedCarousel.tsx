import EventCoverImage from '@/components/events/EventCoverImage';
import { AppColors } from '@/constants/theme';
import type { EventListItem } from '@/utils/eventPresentation';
import {
  formatCapacityLabel,
  formatFeaturedDateLine,
  formatLocationLine,
  getCategoryMeta,
  primaryCategoryKey,
} from '@/utils/eventPresentation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const CARD_WIDTH = Dimensions.get('window').width - 32;

type EventFeaturedCarouselProps = {
  items: EventListItem[];
};

export default function EventFeaturedCarousel({ items }: EventFeaturedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (items.length === 0) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + 12));
    setActiveIndex(Math.min(Math.max(index, 0), items.length - 1));
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {items.map((item) => {
          const cat = getCategoryMeta(primaryCategoryKey(item));
          return (
            <Pressable
              key={item.id}
              style={styles.card}
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
              <EventCoverImage uri={item.imagem} style={styles.image} />
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.35)', 'rgba(15, 23, 42, 0.78)']}
                locations={[0, 0.5, 1]}
                style={styles.overlay}
              />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DESTAQUE</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.categoryPill}>
                  <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {item.titulo}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.metaText}>{formatFeaturedDateLine(item)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {formatLocationLine(item)}
                  </Text>
                </View>
                <View style={styles.footerRow}>
                  {formatCapacityLabel(item.capacity) ? (
                    <Text style={styles.capacityText}>
                      Capacidade: {formatCapacityLabel(item.capacity)}
                    </Text>
                  ) : (
                    <View style={styles.footerSpacer} />
                  )}
                  <View style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={20} color={AppColors.text.secondary} />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {items.map((item, i) => (
          <View key={item.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: AppColors.gray[300],
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 2,
    backgroundColor: AppColors.tab.active,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    gap: 6,
    zIndex: 2,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  capacityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  footerSpacer: {
    flex: 1,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.gray[300],
  },
  dotActive: {
    width: 18,
    backgroundColor: AppColors.tab.active,
  },
});
