import { jobsNearBy } from '@/components/JobsOpportunities';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JobDetailTab() {
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = jobsNearBy.find((j) => j.id === jobId) ?? jobsNearBy[0];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/JobsTab');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={16}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
        </Pressable>
        <Pressable
          hitSlop={12}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Ionicons name="share-outline" size={24} color={AppColors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: job.image }}
          style={styles.heroImage}
          imageStyle={styles.heroImageStyle}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="briefcase-outline" size={14} color={AppColors.text.white} />
              <Text style={styles.heroBadgeText}>{job.contractType ?? 'CLT'}</Text>
            </View>
            <Text style={styles.heroTitle}>{job.title}</Text>
          </View>
        </ImageBackground>

        <View style={styles.card}>
          <View style={styles.companyRow}>
            <Image source={{ uri: job.image }} style={styles.companyLogo} />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{job.company}</Text>
              <Text style={styles.companyLocation}>{job.location}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>ABERTO</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PROVENTO</Text>
              <Text style={styles.statValue}>{job.salary}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, styles.statLabelPink]}>PRAZO FINAL</Text>
              <Text style={styles.statValue}>Imediato</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>Visão Geral</Text>
            <Text style={styles.sectionText}>
              {job.description ?? 'Descrição da vaga em breve.'}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionBar, styles.sectionBarGreen]} />
            <Text style={styles.sectionTitle}>O que você precisa</Text>
            <View style={styles.requirementsList}>
              {(job.requirements ?? ['Requisitos em breve.']).map((req, i) => (
                <View key={i} style={styles.requirementItem}>
                  <View style={styles.requirementIcon}>
                    <Ionicons name="shield-checkmark" size={18} color={AppColors.text.white} />
                  </View>
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
        >
          <Ionicons name="person-add-outline" size={22} color={AppColors.text.white} />
          <Text style={styles.ctaButtonText}>CANDIDATAR-SE À VAGA</Text>
          <Ionicons name="arrow-forward" size={20} color={AppColors.text.white} />
        </Pressable>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  heroImage: {
    height: 220,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  heroContent: {
    gap: 12,
    paddingBottom: 28,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.palette.purple.base,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  card: {
    marginHorizontal: 16,
    marginTop: -16,
    backgroundColor: AppColors.background.default,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 20,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.background.input,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  companyLocation: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: AppColors.status.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: AppColors.background.muted,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.palette.purple.base,
  },
  statLabelPink: {
    color: '#db2777',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  section: {
    gap: 8,
  },
  sectionBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: AppColors.palette.purple.base,
  },
  sectionBarGreen: {
    backgroundColor: AppColors.status.success,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  sectionText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    lineHeight: 22,
  },
  requirementsList: {
    gap: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.background.muted,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  requirementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.palette.purple.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: {
    fontSize: 14,
    color: AppColors.text.secondary,
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.text.primary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  ctaButtonPressed: {
    opacity: 0.9,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.white,
  },
});
