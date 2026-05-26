import { ModalAnimals } from '@/components/ModalAnimals';
import { ModalReportPrefeitura } from '@/components/ModalReportPrefeitura';
import { ModalResolvedProblems } from '@/components/ModalResolvedProblems';
import { ModalSecurity } from '@/components/ModalSecurity';
import { DemandsView } from '@/components/DemandsView';
import { WorksInProgressView } from '@/components/WorksInProgressView';
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
  const [activeTab, setActiveTab] = useState<'catalogo' | 'obras' | 'demandas'>('catalogo');

  const handleCardPress = (serviceId: string, title: string) => {
    const routes = {
      health: '/HealthService',
      transport: '/PublicTransportation',
      education: '/EducationTab',
      jobs: '/JobsTab',
      servicesPro: '/ServicesAndProfessionals',
      marketplace: '/marketplace',
    } as const;

    if (serviceId in routes) {
      const pathname = routes[serviceId as keyof typeof routes] as string;
      router.push({ pathname } as any);
      return;
    }
  
    if (serviceId === 'workInProgess') {
      setActiveTab('obras');
      return;
    }

    const modals = ['security', 'resolvedProblems', 'animals', 'municipalContact'];
  
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
      <View style={styles.segment}>
        {(
          [
            { id: 'catalogo', label: 'CATÁLOGO' },
            { id: 'obras', label: 'OBRAS' },
            { id: 'demandas', label: 'DEMANDAS' },
          ] as const
        ).map((t) => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.85}
              onPress={() => setActiveTab(t.id)}
              style={[styles.segmentItem, active ? styles.segmentItemActive : styles.segmentItemInactive]}
            >
              <Text style={[styles.segmentText, active ? styles.segmentTextActive : styles.segmentTextInactive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'catalogo' ? (
        <FlatList
          data={servicesCards.filter((c) => c.id !== 'workInProgess' && c.id !== 'resolvedProblems')}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const webCardProps = isWeb ? ({ className: `service-card ${item.gradientClass}` } as any) : {};
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
      ) : activeTab === 'obras' ? (
        <WorksInProgressView />
      ) : (
        <DemandsView />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: AppColors.background.default,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#0F172A',
  },
  segmentItemInactive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  segmentTextActive: {
    color: '#fff',
  },
  segmentTextInactive: {
    color: '#334155',
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