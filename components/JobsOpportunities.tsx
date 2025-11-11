import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type JobCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  image: string;
};

const jobsNearBy: JobCard[] = [
  {
    id: 'job-1',
    title: 'Analista de Marketing Digital',
    company: 'TechSolutions',
    location: 'Centro',
    salary: 'R$ 4.500',
    image:
      'https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&auto=format&fit=crop',
  },
  {
    id: 'job-2',
    title: 'Vendedor(a) de Loja',
    company: 'Varejo Fashion',
    location: 'Shopping Tijuca',
    salary: 'R$ 2.200 + Com.',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop',
  },
  {
    id: 'job-3',
    title: 'Desenvolvedor(a) Frontend',
    company: 'Inova Web',
    location: 'Remoto',
    salary: 'A combinar',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&auto=format&fit=crop',
  },
  {
    id: 'job-4',
    title: 'Recepcionista Bilíngue',
    company: 'Hotel Palace',
    location: 'Copacabana',
    salary: 'R$ 3.000',
    image:
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=200&auto=format&fit=crop',
  },
];

export default function JobsOpportunities() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Oportunidades Perto de Você</Text>
        <Pressable hitSlop={8} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Ver todas</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {jobsNearBy.map((job) => (
          <View key={job.id} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: job.image }} style={styles.cardImage} />
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text style={styles.cardCompany}>{job.company}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={AppColors.text.tertiary}
                  />
                  <Text style={styles.locationText}>{job.location}</Text>
                </View>
                <Text style={styles.salaryText}>{job.salary}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 260;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  viewAllButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.accent,
  },
  cardsRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderColor: AppColors.border.muted,
    borderWidth: 0.5,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: AppColors.background.input,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
    flexShrink: 1,
  },
  cardCompany: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    paddingTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  locationText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    flexShrink: 1,
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.palette.teal.base,
    flexShrink: 0,
  },
});

