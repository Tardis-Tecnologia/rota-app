import { AppColors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
const SIDE_PADDING = 24;
const CARD_SPACING = 12;
const CARD_WIDTH = Math.round(width * 0.78);
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

interface Novidade {
  id: string;
  titulo: string;
  descricao: string;
  imagem: string;
}

export default function NewsCarousel() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const novidades: Novidade[] = useMemo(
    () => [
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
    ],
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % novidades.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SNAP_INTERVAL,
        animated: true,
      });
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [currentIndex, novidades.length]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SNAP_INTERVAL);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleDotPress = (index: number) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.kicker}>EM DESTAQUE</Text>
          <Text style={styles.title}>Novidades</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Ver novidades"
          activeOpacity={0.85}
          style={styles.headerAction}
          onPress={() => {
            // placeholder: mantém o layout do botão conforme design
            void 0;
          }}
        >
          <Feather name="star" size={18} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          contentContainerStyle={styles.scrollContent}
        >
          {novidades.map((novidade, index) => (
            <View
              key={novidade.id}
              style={[
                styles.carouselItem,
                { width: CARD_WIDTH },
                index !== novidades.length - 1 && { marginRight: CARD_SPACING },
              ]}
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
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: AppColors.text.tertiary,
    marginBottom: 6,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  carouselContainer: {
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingRight: SIDE_PADDING,
  },
  carouselItem: {
    height: 208, // h-52 = 208px
    borderRadius: 20,
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
});

