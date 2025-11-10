import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
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
    title: 'Empregos',
    colors: AppColors.gradients.services.jobs,
    icon: 'briefcase-outline',
    gradientClass: 'service-card--jobs',
  },
  {
    id: 'culture',
    title: 'Cultura',
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
    id: 'citizenship',
    title: 'Cidadania',
    colors: AppColors.gradients.services.citizenship,
    icon: 'people-circle-outline',
    gradientClass: 'service-card--citizenship',
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
  const handleCardPress = (serviceId: string, title: string) => {
    if (serviceId === 'health') {
      router.push('/HealthService');
      return;
    }

      if (serviceId === 'transport') {
        router.push('/PublicTransportation');
        return;
      }

    Alert.alert(title, 'Serviço disponível em breve.');
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
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

  return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.cardWrapper}
              onPress={() => handleCardPress(item.id, item.title)}
            >
              <LinearGradient colors={item.colors} style={styles.gradient}>
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
  listContent: {
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flex: 1,
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  webCardWrapper: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  gradient: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 140,
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