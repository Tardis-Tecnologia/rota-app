import { AppColors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface JobSuggestionProps {
  onViewMore?: () => void;
}

export default function JobSuggestionCard({ onViewMore }: JobSuggestionProps) {
  const handlePress = () => {
    if (onViewMore) {
      onViewMore();
    } else {
      router.push('/JobsTab');
    }
  };

  return (
    <View style={styles.section}>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: '700',
            color: '#1F2937',
            marginBottom: 12,
            marginTop: 16,
        }}>
            Para você
        </Text>
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={['#0d9488', '#14b8a6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={handlePress}
            activeOpacity={0.85}
          >
            {/* Icon Badge */}
            <View style={styles.iconBadge}>
              <MaterialIcons
                name="work-outline"
                size={32}
                color={AppColors.background.light}
              />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.label}>Vaga sugerida para você</Text>
              <Text style={styles.jobTitle}>Eletricista Residencial</Text>
              <Text style={styles.jobDetails}>
                2km de distância • R$ 2.800/mês
              </Text>
            </View>

            {/* Arrow */}
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={AppColors.background.light}
            />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  gradient: {
    padding: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.background.light,
    lineHeight: 24,
  },
  jobDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
});
