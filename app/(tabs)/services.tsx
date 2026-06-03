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
    id: 'municipalContact',
    title: 'Contato com Prefeitura',
    titleLines: ['Contato com', 'Prefeitura'],
    icon: 'call-outline',
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
  },
  {
    id: 'animals',
    title: 'Animais, Meio Ambiente / ONG',
    titleLines: ['Animais, Meio', 'Ambiente / ONG'],
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
    id: 'workInProgess',
    title: 'Obras',
    icon: 'business-outline',
    iconColor: '#1D4ED8',
    iconBg: '#DBEAFE',
  },
  {
    id: 'demands',
    title: 'Demandas',
    icon: 'clipboard-outline',
    iconColor: '#CA8A04',
    iconBg: '#FEF9C3',
  },
];

function ServicesListHeader() {
  return (
    <>
      <ServicesHeroBanner />
      <QuickAccessSection />
    </>
  );
}

export default function ServicosScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleCardPress = (serviceId: string, title: string) => {
    if (serviceId === 'servicesPro') {
      router.push('/guia');
      return;
    }

    if (serviceId === 'marketplace') {
      router.push('/marketplace');
      return;
    }

    if (serviceId === 'workInProgess') {
      router.push('/works');
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
