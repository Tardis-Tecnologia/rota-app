import { AppColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Largura com padding

interface Novidade {
  id: string;
  titulo: string;
  descricao: string;
  imagem: string;
}

export default function NovidadesCarousel() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const novidades: Novidade[] = [
    {
      id: '1',
      titulo: 'Novo Parque da Cidade Inaugurado!',
      descricao: 'Um novo espaço de lazer para toda a família.',
      imagem: 'https://soumaiscarioca.com.br/wp-content/uploads/2021/10/capa-video.jpg',
    },
    {
      id: '2',
      titulo: 'Expansão da Ciclovia Orla',
      descricao: 'Mais 5km de ciclovia para sua segurança.',
      imagem: 'https://ogimg.infoglobo.com.br/in/24454360-46b-a34/FT1086A/Projeto-de-como-ficara-a-ciclovia-na-Praia-de-Piratininga..jpg',
    },
    {
      id: '3',
      titulo: 'Matrículas Abertas 2026',
      descricao: 'Garanta já a vaga do seu filho na rede pública.',
      imagem: 'https://vitrinemadri.cdn.magazord.com.br/img/2025/02/blog/15613/crianca-escola-mochila-livros.jpg',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % novidades.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * CARD_WIDTH,
        animated: true,
      });
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [currentIndex, novidades.length]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CARD_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleDotPress = (index: number) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * CARD_WIDTH,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Novidades</Text>
      </View>

      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH}
        >
          {novidades.map((novidade) => (
            <TouchableOpacity
              key={novidade.id}
              style={[styles.carouselItem, { width: CARD_WIDTH }]}
              activeOpacity={0.9}
              onPress={() => router.push(`/(tabs)/noticia/${novidade.id}`)}
            >
              <Image
                source={{ uri: novidade.imagem }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                style={styles.gradient}
              />
              <View style={styles.content}>
                <Text style={styles.titulo} numberOfLines={2}>
                  {novidade.titulo}
                </Text>
                <Text style={styles.descricao} numberOfLines={2}>
                  {novidade.descricao}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.dotsContainer}>
          {novidades.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
              onPress={() => handleDotPress(index)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  carouselContainer: {
    paddingHorizontal: 24,
    position: 'relative',
  },
  carouselItem: {
    height: 208, // h-52 = 208px
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: AppColors.gray[300],
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginRight: 0,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text.white,
    marginBottom: 4,
  },
  descricao: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    right: 28,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: AppColors.text.white,
    width: 24,
  },
});

