import { ModalMarketplace } from '@/components/ModalMarketplace';
import { ModalSecurity } from '@/components/ModalSecurity';
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
  {
    id: 'transport',
    title: 'Transporte',
    colors: AppColors.gradients.services.transport,
    icon: 'bus-outline',
    gradientClass: 'service-card--transport',
  },
  {
    id: 'health',
    title: 'Saúde',
    colors: AppColors.gradients.services.health,
    icon: 'heart-circle-outline',
    gradientClass: 'service-card--health',
  },
  {
    id: 'education',
    title: 'Educação',
    colors: AppColors.gradients.services.education,
    icon: 'school-outline',
    gradientClass: 'service-card--education',
  },
  {
    id: 'jobs',
    title: 'Carreiras & Concursos',
    colors: AppColors.gradients.services.jobs,
    icon: 'briefcase-outline',
    gradientClass: 'service-card--jobs',
  },
  {
    id: 'security',
    title: 'Segurança',
    colors: AppColors.gradients.services.security,
    icon: 'shield-outline',
    gradientClass: 'service-card--security',
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
  {
    id: 'culture',
    title: 'Cultura e Lazer',
    colors: AppColors.gradients.services.culture,
    icon: 'color-palette-outline',
    gradientClass: 'service-card--culture',
  },
  {
    id: 'tourism',
    title: 'Turismo',
    colors: AppColors.gradients.services.tourism,
    icon: 'camera-outline',
    gradientClass: 'service-card--tourism',
  },
  {
    id: 'animals',
    title: 'Animais',
    colors: AppColors.gradients.services.animals,
    icon: 'paw-outline',
    gradientClass: 'service-card--animals',
  },
];

export default function ServicosScreen() {
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [marketplaceModalVisible, setMarketplaceModalVisible] = useState(false);
  
  const handleCardPress = (serviceId: string, title: string) => {
    if (serviceId === 'health') {
      router.push('/HealthService');
      return;
    }

    if (serviceId === 'transport') {
      router.push('/PublicTransportation');
      return;
    }

    if (serviceId === 'education') {
      router.push('/EducationTab');
      return;
    }

    if (serviceId === 'jobs') {
      router.push('/JobsTab');
      return;
    }

    if (serviceId === 'security') {
      setSecurityModalVisible(true);
      return;
    }

    if (serviceId === 'marketplace') {
      setMarketplaceModalVisible(true);
      return;
    }

    if (serviceId === 'servicesPro') {
      router.push('/ServicesAndProfessionals');
      return;
    }

    Alert.alert(title, 'Serviço disponível em breve.');
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <ModalSecurity
        visible={securityModalVisible}
        onClose={() => setSecurityModalVisible(false)}
      />
      <ModalMarketplace
        visible={marketplaceModalVisible}
        onClose={() => setMarketplaceModalVisible(false)}
      />
      <Text style={styles.sectionTitle}>Serviços Públicos</Text>
      <FlatList
        data={servicesCards}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const webCardProps = isWeb
            ? ({ className: `service-card ${item.gradientClass}` } as any)
            : {};
          const webIconProps = isWeb ? ({ className: 'service-card__icon' } as any) : {};

          const cardContent = (
            <>
              <View style={styles.iconContainer} {...webIconProps}>
                <Ionicons name={item.icon as any} size={28} color={AppColors.text.white} />
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
    fontSize: 18,
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
    height: 160,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 0,
  },
  webCardWrapper: {
    height: 160,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  gradient: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconContainer: {
    borderRadius: 999,
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.white,
  },
});