import JobsOpportunities from '@/components/JobsOpportunities';
import type { JobCategoryId } from '@/constants/jobCategories';
import { JOB_CATEGORIES } from '@/constants/jobCategories';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const heroBanner = {
  title: 'Carreira Pública RJ 2024',
  description: 'Editais abertos com salários de até R$ 22.000 mensais.',
  image:
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop',
  tag: 'URGENTE: CONCURSO PÚBLICO',
};

export default function JobsTab() {
  const [activeCategory, setActiveCategory] = useState<JobCategoryId>('todos');

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

          <Text style={styles.headerTitle}>Oportunidades</Text>

          <Pressable
            hitSlop={12}
            style={({ pressed }) => [
              styles.filterButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons
              name="filter-outline"
              size={24}
              color={AppColors.text.tertiary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: heroBanner.image }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={['#3C3895', '#312E82']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>{heroBanner.tag}</Text>
              </View>
              <Text style={styles.heroTitle}>{heroBanner.title}</Text>
              <Text style={styles.heroSubtitle}>{heroBanner.description}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.heroCta,
                  pressed && styles.heroCtaPressed,
                ]}
              >
                <Text style={styles.heroCtaText}>ACESSAR EDITAIS</Text>
                <Ionicons name="arrow-forward" size={18} color={AppColors.text.secondary} />
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.filtersContainer}>
          {JOB_CATEGORIES.map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setActiveCategory(item.id as JobCategoryId)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.jobsOpportunitiesContainer}>
          <JobsOpportunities variant="list" activeCategory={activeCategory} />
        </View>

        <View style={styles.bottomCtaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.bottomCta,
              pressed && styles.bottomCtaPressed,
            ]}
          >
            <Text style={styles.bottomCtaText}>PAINEL DO EMPREGADOR</Text>
          </Pressable>
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.overlayPressed,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
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
  heroContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 200,
  },
  heroImage: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: 24,
  },
  heroContent: {
    padding: 20,
    gap: 10,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.background.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.text.yellow,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  heroSubtitle: {
    fontSize: 13,
    color: AppColors.text.white,
    opacity: 0.9,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.text.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  heroCtaPressed: {
    opacity: 0.9,
  },
  heroCtaText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.background.darkBlue,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.background.muted,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  filterChipActive: {
    backgroundColor: AppColors.palette.indigo.light,
    borderColor: AppColors.palette.purple.base,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  filterChipTextActive: {
    color: AppColors.palette.purple.base,
  },
  jobsOpportunitiesContainer: {
    marginHorizontal: 16,
  },
  bottomCtaContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingBottom: 16,
  },
  bottomCta: {
    backgroundColor: AppColors.background.darkBlue,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaPressed: {
    opacity: 0.9,
  },
  bottomCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.white,
  },
});