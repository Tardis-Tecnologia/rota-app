import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type JobType = 'Remoto' | 'Presencial' | 'Híbrido';

type JobCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  salary: string;
  image: string;
  distance: number; // em km, para ordenação por proximidade
};

const jobsNearBy: JobCard[] = [
  {
    id: 'job-1',
    title: 'Atendente de Padaria',
    company: 'Padaria Pão Dourado',
    location: 'Centro',
    type: 'Presencial',
    salary: 'R$ 1.800',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop',
    distance: 0.5,
  },
  {
    id: 'job-2',
    title: 'Auxiliar Administrativo',
    company: 'Prefeitura de Maricá',
    location: 'Centro',
    type: 'Presencial',
    salary: 'R$ 2.200',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    distance: 0.8,
  },
  {
    id: 'job-3',
    title: 'Vendedor(a) de Loja',
    company: 'Varejo Fashion',
    location: 'Shopping Maricá',
    type: 'Presencial',
    salary: 'R$ 2.200 + Com.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop',
    distance: 1.2,
  },
  {
    id: 'job-4',
    title: 'Desenvolvedor(a) Frontend',
    company: 'Inova Web',
    location: 'Itaipuaçu',
    type: 'Remoto',
    salary: 'R$ 5.500',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&auto=format&fit=crop',
    distance: 1.5,
  },
  {
    id: 'job-5',
    title: 'Analista de Marketing Digital',
    company: 'TechSolutions',
    location: 'Ponta Negra',
    type: 'Híbrido',
    salary: 'R$ 4.500',
    image: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&auto=format&fit=crop',
    distance: 2.0,
  },
  {
    id: 'job-6',
    title: 'Garçom/Garçonete',
    company: 'Restaurante Sabor da Terra',
    location: 'Araçatiba',
    type: 'Presencial',
    salary: 'R$ 1.600 + Gorjetas',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&auto=format&fit=crop',
    distance: 2.3,
  },
  {
    id: 'job-7',
    title: 'Recepcionista Bilíngue',
    company: 'Hotel Maricá Beach',
    location: 'Barra de Maricá',
    type: 'Presencial',
    salary: 'R$ 3.000',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=200&auto=format&fit=crop',
    distance: 3.1,
  },
  {
    id: 'job-8',
    title: 'Designer Gráfico',
    company: 'Agência Criativa',
    location: 'Inoã',
    type: 'Híbrido',
    salary: 'R$ 3.800',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&auto=format&fit=crop',
    distance: 3.5,
  },
  {
    id: 'job-9',
    title: 'Cuidador(a) de Idosos',
    company: 'Casa de Repouso Vida Plena',
    location: 'São José do Imbassaí',
    type: 'Presencial',
    salary: 'R$ 2.000',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=200&auto=format&fit=crop',
    distance: 4.2,
  },
  {
    id: 'job-10',
    title: 'Assistente de RH',
    company: 'Grupo Empresarial Maricá',
    location: 'Jardim Atlântico',
    type: 'Presencial',
    salary: 'R$ 2.800',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop',
    distance: 4.8,
  },
] as JobCard[];

// Ordena por proximidade
const sortedJobs = [...jobsNearBy].sort((a, b) => a.distance - b.distance);

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
        {sortedJobs.map((job) => {
          const typeStyles = {
            Remoto: { bg: '#DCFCE7', text: '#166534' },
            Presencial: { bg: '#DBEAFE', text: '#1E40AF' },
            Híbrido: { bg: '#FEF3C7', text: '#92400E' },
          };
          const typeStyle = typeStyles[job.type];

          return (
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

                <View style={styles.infoRow}>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={AppColors.text.tertiary}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>{job.location}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                    <Text style={[styles.typeText, { color: typeStyle.text }]}>{job.type}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.distanceText}>{job.distance} km de você</Text>
                  <Text style={styles.salaryText}>{job.salary}</Text>
                </View>
              </View>
            </View>
          );
        })}
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
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  viewAllButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  viewAllText: {
    fontSize: 14,
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
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15, 23, 42, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    paddingTop: 12,
  },
  distanceText: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.palette.teal.base,
    flexShrink: 0,
  },
});

