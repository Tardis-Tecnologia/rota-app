import { AppColors } from '@/constants/theme';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from 'react-native';

const { width } = Dimensions.get('window');

interface HealthSlide {
  id: string;
  title: string;
  description: string;
  image: string;
}

const SLIDES: HealthSlide[] = [
  {
    id: '1',
    title: 'Atendimento Humanizado',
    description: 'Nossa prioridade é o seu bem-estar.',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=2073&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Tecnologia de Ponta',
    description: 'Equipamentos modernos para diagnósticos precisos.',
    image: 'https://www.officetotal.com.br/wp-content/uploads/2024/05/tecnologia-medica-900x506.jpg',
  },
  {
    id: '3',
    title: 'Campanha de Vacinação',
    description: 'Proteja-se e proteja quem você ama.',
    image: 'https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?q=80&w=2071&auto=format&fit=crop',
  },
];

export default function HealthCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<HealthSlide>>(null);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<HealthSlide>[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  });

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => <CarouselItem slide={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        decelerationRate="fast"
      />

      <View style={styles.dotsContainer}>
        {SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              key={slide.id}
              onPress={() => scrollToIndex(index)}
              style={[
                styles.dot,
                isActive && styles.dotActive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function CarouselItem({ slide }: { slide: HealthSlide }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: slide.image }} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>
    </View>
  );
}

const CARD_WIDTH = width - 32;
const CARD_HEIGHT = 180;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: AppColors.gray[200],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  description: {
    fontSize: 14,
    color: AppColors.text.white,
    opacity: 0.9,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 24,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: AppColors.text.white,
    width: 16,
  },
});

