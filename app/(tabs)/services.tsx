import { ModalAnimals } from '@/components/ModalAnimals';
import { ModalReportPrefeitura } from '@/components/ModalReportPrefeitura';
import { ModalSecurity } from '@/components/ModalSecurity';
import QuickAccessSection from '@/components/QuickAccessSection';
import ServicesHeroBanner from '@/components/ServicesHeroBanner';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
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
  titleLines?: string[];
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

const servicesCards: ServiceCard[] = [
  {
    id: 'education',
    title: 'Educação',
    icon: 'school-outline',
    iconColor: '#0891B2',
    iconBg: '#CFFAFE',
  },
  {
    id: 'health',
    title: 'Saúde',
    icon: 'medkit-outline',
    iconColor: '#DC2626',
    iconBg: '#FEE2E2',
  },
  {
    id: 'jobs',
    title: 'Emprego',
    icon: 'briefcase-outline',
    iconColor: '#0F766E',
    iconBg: '#CCFBF1',
  },
  {
    id: 'municipalContact',
    title: 'Contato com Prefeitura',
    titleLines: ['Contato com', 'Prefeitura'],
    icon: 'call-outline',
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
  },
  {
    id: 'animals',
    title: 'Animais perdidos',
    titleLines: ['Animais', 'perdidos'],
    icon: 'paw-outline',
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
  },
  {
    id: 'servicesPro',
    title: 'Serviços & Profissionais',
    titleLines: ['Serviços &', 'Profissionais'],
    icon: 'construct-outline',
    iconColor: '#7C3AED',
    iconBg: '#EDE9FE',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: 'bag-outline',
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
  },
  {
    id: 'demands',
    title: 'Realizações',
    icon: 'clipboard-outline',
    iconColor: '#CA8A04',
    iconBg: '#FEF9C3',
  },
];

function ServicesListHeader() {
  return (
    <View style={styles.listHeader}>
      <ServicesHeroBanner />
      <QuickAccessSection />
    </View>
  );
}

export default function ServicosScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleCardPress = (serviceId: string, title: string) => {
    if (serviceId === 'education') {
      router.push('/education' as Href);
      return;
    }

    if (serviceId === 'health') {
      router.push('/HealthService');
      return;
    }

    if (serviceId === 'servicesPro') {
      router.push('/guia');
      return;
    }

    if (serviceId === 'marketplace') {
      router.push('/marketplace');
      return;
    }

    if (serviceId === 'jobs') {
      router.push('/JobsTab');
      return;
    }

    if (serviceId === 'demands') {
      router.push('/demands' as Href);
      return;
    }

    const modals = ['security', 'animals', 'municipalContact'];

    if (modals.includes(serviceId)) {
      setActiveModal(serviceId);
      return;
    }

    Alert.alert(title, 'Serviço disponível em breve.');
  };

  return (
    <View style={styles.container}>
      <ModalSecurity
        visible={activeModal === 'security'}
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

      <FlatList
        data={servicesCards}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ServicesListHeader}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => handleCardPress(item.id, item.title)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <View style={styles.titleWrap}>
              {item.titleLines ? (
                item.titleLines.map((line) => (
                  <Text
                    key={line}
                    style={styles.cardTitle}
                    lineBreakStrategyIOS="push-out"
                    {...(Platform.OS === 'android' ? { textBreakStrategy: 'simple' as const } : {})}
                  >
                    {line}
                  </Text>
                ))
              ) : (
                <Text
                  style={styles.cardTitle}
                  numberOfLines={2}
                  lineBreakStrategyIOS="push-out"
                  {...(Platform.OS === 'android' ? { textBreakStrategy: 'simple' as const } : {})}
                >
                  {item.title}
                </Text>
              )}
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  listHeader: {
    marginBottom: 12,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 10,
    paddingRight: 28,
    minHeight: 88,
    gap: 8,
    position: 'relative',
    overflow: 'visible',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
    paddingRight: 4,
  },
  cardTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  chevronWrap: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    width: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
