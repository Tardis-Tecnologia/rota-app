import { EmergencyPhones } from '@/components/EmergencyPhones';
import { ModalAnimals } from '@/components/ModalAnimals';
import { ModalMarketplace } from '@/components/ModalMarketplace';
import { ModalReportPrefeitura } from '@/components/ModalReportPrefeitura';
import { ModalResolvedProblems } from '@/components/ModalResolvedProblems';
import { ModalSecurity } from '@/components/ModalSecurity';
import { ModalWorksInProgress } from '@/components/ModalWorksInProgress';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ServiceCard = {
  id: string;
  title: string;
  colors: [string, string];
  icon: string;
  gradientClass: string;
};

const servicesCards: ServiceCard[] = [
  // {
  //   id: 'transport',
  //   title: 'Transporte',
  //   colors: AppColors.gradients.services.transport,
  //   icon: 'bus-outline',
  //   gradientClass: 'service-card--transport',
  // },
  // {
  //   id: 'health',
  //   title: 'Saúde',
  //   colors: AppColors.gradients.services.health,
  //   icon: 'heart-circle-outline',
  //   gradientClass: 'service-card--health',
  // },
  // {
  //   id: 'education',
  //   title: 'Educação',
  //   colors: AppColors.gradients.services.education,
  //   icon: 'school-outline',
  //   gradientClass: 'service-card--education',
  // },
  // {
  //   id: 'jobs',
  //   title: 'Carreiras & Concursos',
  //   colors: AppColors.gradients.services.jobs,
  //   icon: 'briefcase-outline',
  //   gradientClass: 'service-card--jobs',
  // },
  // {
  //   id: 'security',
  //   title: 'Segurança',
  //   colors: AppColors.gradients.services.security,
  //   icon: 'shield-outline',
  //   gradientClass: 'service-card--security',
  // },
  {
    id: 'workInProgess',
    title: 'Obras em andamento',
    colors: AppColors.gradients.services.workInProgess,
    icon: 'business-outline',
    gradientClass: 'service-card--workInProgess',
  },
  {
    id: 'resolvedProblems',
    title: 'Demandas Resolvidas',
    colors: AppColors.gradients.services.resolvedProblems,
    icon: 'checkmark-circle-outline',
    gradientClass: 'service-card--resolvedProblems',
  },
  {
    id: 'municipalContact',
    title: 'Contato com Prefeitura',
    colors: AppColors.gradients.services.municipalContact,
    icon: 'call-outline',
    gradientClass: 'service-card--municipalContact',
  },
  {
    id: 'animals',
    title: 'Animais - Meio Ambiente / ONG',
    colors: AppColors.gradients.services.animals,
    icon: 'paw-outline',
    gradientClass: 'service-card--animals',
  },
  {
    id: 'servicesPro',
    title: 'Serviços & Profissionais',
    colors: AppColors.gradients.services.servicesPro,
    icon: 'construct-outline',
    gradientClass: 'service-card--servicesPro',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    colors: AppColors.gradients.services.marketplace,
    icon: 'bag-outline',
    gradientClass: 'service-card--marketplace',
  },
  // {
  //   id: 'culture',
  //   title: 'Cultura e Lazer',
  //   colors: AppColors.gradients.services.culture,
  //   icon: 'color-palette-outline',
  //   gradientClass: 'service-card--culture',
  // },
  // {
  //   id: 'tourism',
  //   title: 'Turismo',
  //   colors: AppColors.gradients.services.tourism,
  //   icon: 'camera-outline',
  //   gradientClass: 'service-card--tourism',
  // },
];

export default function ServicosScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleCardPress = (serviceId: string, title: string) => {
    const routes = {
      health: '/HealthService',
      transport: '/PublicTransportation',
      education: '/EducationTab',
      jobs: '/JobsTab',
      servicesPro: '/ServicesAndProfessionals',
    } as const;

    if (serviceId in routes) {
      router.push(routes[serviceId as keyof typeof routes]);
      return;
    }
  
    const modals = [
      'security',
      'workInProgess',
      'resolvedProblems',
      'marketplace',
      'animals',
      'municipalContact',
    ];
  
    if (modals.includes(serviceId)) {
      setActiveModal(serviceId);
      return;
    }
  
    Alert.alert(title, 'Serviço disponível em breve.');
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <ModalSecurity
        visible={activeModal === 'security'}
        onClose={() => setActiveModal(null)}
      />
      <ModalMarketplace
        visible={activeModal === 'marketplace'}
        onClose={() => setActiveModal(null)}
      />
      <ModalWorksInProgress
        visible={activeModal === 'workInProgess'}
        onClose={() => setActiveModal(null)}
      />
      <ModalResolvedProblems
        visible={activeModal === 'resolvedProblems'}
        onClose={() => setActiveModal(null)}
      />
      <ModalAnimals
        visible={activeModal === 'animals'}
        onClose={() => setActiveModal(null)}
      />
      <ModalReportPrefeitura
        visible={activeModal === 'municipalContact'}
        onClose={() => setActiveModal(null)}
      />
      <Text style={styles.sectionTitle}>Serviços</Text>
      <FlatList
        data={servicesCards}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<EmergencyPhones />}
        renderItem={({ item }) => {
          const webCardProps = isWeb
            ? ({ className: `service-card ${item.gradientClass}` } as any)
            : {};
          const webIconProps = isWeb ? ({ className: 'service-card__icon' } as any) : {};

          const cardContent = (
            <>
              <View style={styles.iconContainer} {...webIconProps}>
                <Ionicons name={item.icon as any} size={26} color={AppColors.text.white} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </>
          );

          if (isWeb) {
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={[styles.cardWrapper, styles.webCardWrapper]}
                onPress={() => handleCardPress(item.id, item.title)}
                {...webCardProps}
              >
                {cardContent}
              </TouchableOpacity>
            );
          }

          const gradientColors: [string, string] =
            item.colors && item.colors[0] && item.colors[1]
              ? [String(item.colors[0]).trim(), String(item.colors[1]).trim()]
              : [AppColors.gradients.services.transport[0], AppColors.gradients.services.transport[1]];

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.cardWrapper}
              onPress={() => handleCardPress(item.id, item.title)}
            >
              <LinearGradient colors={gradientColors} style={styles.gradient}>
                {cardContent}
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
    height: 140,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 0,
  },
  webCardWrapper: {
    height: 140,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  gradient: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  iconContainer: {
    borderRadius: 999,
    padding: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    color: AppColors.text.white,
    flexShrink: 0,
  },
});