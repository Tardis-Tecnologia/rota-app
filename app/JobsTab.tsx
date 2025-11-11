import InternshipOpportunities from '@/components/InternshipOpportunities';
import JobsOpportunities from '@/components/JobsOpportunities';
import PublicTenders from '@/components/PublicTenders';
import ServiceProviders from '@/components/ServiceProviders';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 32;

const carouselItems = [
  {
    id: 'slide-1',
    title: 'Sua Carreira Decola Aqui',
    description: 'Encontre vagas em empresas de tecnologia.',
    image:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'slide-2',
    title: 'Concursos Públicos 2025',
    description: 'Estabilidade e carreira para você.',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2232&auto=format&fit=crop',
  },
  {
    id: 'slide-3',
    title: 'Programa Jovem Aprendiz',
    description: 'O primeiro passo para um futuro brilhante.',
    image:
      'https://images.unsplash.com/photo-1611242320536-f12d3541249b?q=80&w=2070&auto=format&fit=crop',
  },
];

export default function JobsTab() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<FlatList<typeof carouselItems[number]>>(null);

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={AppColors.text.tertiary}
            />
          </Pressable>

          <Text style={styles.headerTitle}>Empregos e Oportunidades</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselRef}
            data={carouselItems}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            snapToInterval={SLIDE_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselListContent}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            renderItem={({ item }) => (
              <View style={[styles.carouselItem, { width: SLIDE_WIDTH }]}>
                <Image source={{ uri: item.image }} style={styles.carouselImage} />
                <LinearGradient
                  colors={[AppColors.background.overlayStrong, 'transparent']}
                  start={{ x: 0.5, y: 1 }}
                  end={{ x: 0.5, y: 0 }}
                  style={styles.carouselGradient}
                />
                <View style={styles.carouselTextContainer}>
                  <Text style={styles.carouselTitle}>{item.title}</Text>
                  <Text style={styles.carouselSubtitle}>{item.description}</Text>
                </View>
              </View>
            )}
          />

          <View style={styles.dotsContainer}>
            {carouselItems.map((item, index) => (
              <View
                key={item.id}
                style={[styles.dot, activeIndex === index && styles.dotActive]}
              />
            ))}
          </View>
        </View>
        <View style={styles.jobsOpportunitiesContainer}>
            <JobsOpportunities />
        </View>
        <View style={styles.serviceProvidersContainer}>
            <ServiceProviders />
        </View>
        <View style={styles.publicTendersContainer}>
          <PublicTenders />
        </View>
        <View style={styles.internshipContainer}>
          <InternshipOpportunities />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  header: {
    backgroundColor: AppColors.background.overlay,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.overlayPressed,
  },
  headerTitle: {
    marginLeft: 40,
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  carouselContainer: {
    height: 208,
    marginHorizontal: 16,
    position: 'relative',
  },
  carouselListContent: {
    gap: 16,
  },
  carouselItem: {
    height: 208,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: AppColors.background.input,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  carouselImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  carouselGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselTextContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    gap: 6,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  carouselSubtitle: {
    fontSize: 13,
    color: AppColors.text.white,
    opacity: 0.85,
  },
  dotsContainer: {
    position: 'absolute',
    right: 28,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.translucent.white40,
  },
  dotActive: {
    backgroundColor: AppColors.text.white,
    width: 18,
  },
  jobsOpportunitiesContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
  },
  serviceProvidersContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  publicTendersContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  internshipContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
});