import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { router } from 'expo-router';

import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type ProviderCategory = {
  id: string;
  label: string;
};

type Provider = {
  id: string;
  name: string;
  categoryId: string;
  rating: number;
  image: string;
  review: number;
  about: string;
  
  reviews: {
    author: string;
    comment: string;
    rating: number;
  }[];
  gallery: string[];
};

const categories: ProviderCategory[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'encanador', label: 'Encanador' },
  { id: 'eletricista', label: 'Eletricista' },
  { id: 'jardineiro', label: 'Jardineiro' },
  { id: 'pintor', label: 'Pintor' },
  { id: 'diarista', label: 'Diarista' },
];

const providers: Provider[] = [
  {
    id: 'provider-1',
    name: 'Mário Encanamentos',
    categoryId: 'encanador',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1505455184862-554165e5f6ba?w=200&auto=format&fit=crop',
    review: 112,

    about:
      'Especialista em reparos hidráulicos residenciais e comerciais. Mais de 15 anos de experiência com vazamentos, desentupimentos e instalações.',

    reviews: [
      {
        author: 'Carlos Silva',
        comment: 'Serviço rápido e eficiente! Resolveu meu vazamento em menos de uma hora.',
        rating: 5,
        
      },
      {
        author: 'Ana Beatriz',
        comment: 'Bom profissional, mas demorou um pouco para chegar.',
        rating: 4,
      },
    ],

    gallery: [
      'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
      'https://images.unsplash.com/photo-1600607687930-1e94c1c28a8d',
    ],
  },
  {
    id: 'provider-2',
    name: 'Raio de Luz Elétrica',
    categoryId: 'eletricista',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1621905251918-48415bdd7e25?w=200&auto=format&fit=crop',
    review: 230,
    
    about:
      'Soluções completas em elétrica. Instalação de quadros, reparos, iluminação e automação. Atendimento 24h para emergências.',

    reviews: [
      {
        author: 'Fernanda Lima',
        comment: 'Excelente! O João é muito profissional e cuidadoso. Recomendo!',
        rating: 5,
      },
      {
        author: 'Ricardo Mendes',
        comment: 'Trocou toda a fiação antiga do meu apartamento. Serviço impecável.',
        rating: 5,
      },
    ],

    gallery: [
      'https://images.unsplash.com/photo-1487814542689-1326d1b721e7',
      'https://images.unsplash.com/photo-1487814542689-1326d1b721e7',
      'https://images.unsplash.com/photo-1487814542689-1326d1b721e7',
    ],
  },
  {
    id: 'provider-3',
    name: 'Jardim Secreto Paisagismo',
    categoryId: 'jardineiro',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1600659520194-3a5c264369d8?w=200&auto=format&fit=crop',
    review: 88,
    about:
      'Criação e manutenção de jardins, gramados e hortas. Transformo seu espaço em um oásis verde.',

    reviews: [
      {
        author: 'Lúcia R.',
        comment: 'Meu jardim nunca esteve tão lindo! Trabalho maravilhoso.',
        rating: 5,
      },
    ],

    gallery: [
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7',
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
      'https://images.unsplash.com/photo-1619283516083-d1433f482d8c',
    ],
  },
  {
    id: 'provider-4',
    name: 'Renova Cores Pinturas',
    categoryId: 'pintor',
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1596821307225-8a1abdd7c494?w=200&auto=format&fit=crop',
    review: 54,
    about:
      'Pintura residencial e predial com acabamento de alta qualidade. Orçamento sem compromisso.',

    reviews: [
      // {
      //   author: 'Carlos Silva',
      //   comment: 'Serviço rápido e eficiente! Resolveu meu vazamento em menos de uma hora.',
      // },
      // {
      //   author: 'Ana Beatriz',
      //   comment: 'Bom profissional, mas demorou um pouco para chegar.',
      // },
    ],

    gallery: [
      // 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20',
      // 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
    ],
  },
  {
    id: 'provider-5',
    name: 'Casa Brilhando Limpeza',
    categoryId: 'diarista',
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&auto=format&fit=crop',
    review: 150,
    
    about:
      'Limpeza e organização pós-obra, faxina pesada e manutenção semanal. Deixo sua casa impecável.',

    reviews: [
      {
        author: 'Mariana C.',
        comment: 'A melhor profissional que já contratei. Detalhista e muito caprichosa.',
        rating: 5,
      },
    ],

    gallery: [
      // 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20',
      // 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
    ],
  },
  {
    id: 'provider-6',
    name: 'SOS Reparos Elétricos',
    categoryId: 'eletricista',
    rating: 4.5,
    image:
      'https://images.unsplash.com/photo-1581092916357-6d2e39310d25?w=200&auto=format&fit=crop',
    review: 95,
    about:
      'Especialista em pequenos reparos e instalações. Chuveiros, tomadas, ventiladores e mais.',

    reviews: [
      // {
      //   author: 'Carlos Silva',
      //   comment: 'Serviço rápido e eficiente! Resolveu meu vazamento em menos de uma hora.',
      // },
      // {
      //   author: 'Ana Beatriz',
      //   comment: 'Bom profissional, mas demorou um pouco para chegar.',
      // },
    ],

    gallery: [
      // 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20',
      // 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
    ],
  },
];

export default function ServiceProviders() {
  const [activeCategory, setActiveCategory] = useState('todos');
  

  const filteredProviders =
    activeCategory === 'todos'
      ? providers
      : providers.filter((provider) => provider.categoryId === activeCategory);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encontre Prestadores de Serviço</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => {
          const isActive = item.id === activeCategory;
          return (
            <Pressable
              onPress={() => setActiveCategory(item.id)}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  isActive && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      <View style={styles.listContainer}>
        {filteredProviders.map((provider) => (
          <View key={provider.id} style={styles.providerCard}>
            <Image source={{ uri: provider.image }} style={styles.avatar} />
            <View style={styles.providerContent}>
              <Text style={styles.providerName} numberOfLines={1}>
                {provider.name}
              </Text>

              <View style={styles.ratingRow}>
                <Ionicons
                  name="star"
                  size={14}
                  color={AppColors.palette.amber.base}
                />
                <Text style={styles.ratingValue}>{provider.rating.toFixed(1)}</Text>
              </View>

            <Pressable
              style={styles.profileButton}
              onPress={() =>
                router.push({
                  pathname: '/ProfileProviderTab',
                  params: {
                    provider: JSON.stringify(provider),
                  },
                })
              }
            >
              <Text style={styles.profileButtonText}>Ver Perfil</Text>
            </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  filtersContainer: {
    gap: 10,
    paddingBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.muted,
  },
  filterButtonActive: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  filterButtonTextActive: {
    color: AppColors.text.white,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 24,
    padding: 15,
    width: '48%',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.background.input,
    borderWidth: 4,
    borderColor: AppColors.background.default,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  providerContent: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.palette.amber.base,
  },
  profileButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  profileButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.accent,
  },
});