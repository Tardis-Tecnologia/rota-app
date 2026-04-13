import CityAlerts from '@/components/CityAlerts';
import CpfRequiredModal from '@/components/CpfRequiredModal';
import EventCarousel from '@/components/EventCarousel';
import Header from '@/components/Header';
import JobSuggestionCard from '@/components/JobSuggestionCard';
import NewsCarousel from '@/components/NewsCarousel';
import NewsPosts from '@/components/NewsPosts';
import OpinionCard from '@/components/OpinionCard';
import Toast from '@/components/Toast';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NoticiasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [cpfNoticeShown, setCpfNoticeShown] = useState(false);
  const [showCpfModal, setShowCpfModal] = useState(false);

  useEffect(() => {
    if (!user || cpfNoticeShown) {
      return;
    }
    const cpfKnown = user.cpf !== undefined;
    if (!cpfKnown) {
      return;
    }
    const hasCpf = Boolean(user.cpf && user.cpf.replace(/\D/g, '').length === 11);
    if (hasCpf) {
      return;
    }
    setCpfNoticeShown(true);
    setShowCpfModal(true);
  }, [cpfNoticeShown, router, user]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleVote = () => {
    // Sempre reinicia o toast com nova key para reiniciar a animação
    setShowToast(false);
    setToastKey((prev) => prev + 1);
    // Aguarda um frame para garantir que o estado foi atualizado
    setTimeout(() => {
      setShowToast(true);
    }, 50);
  };

  const ListHeader = () => (
    <View>
      {/* Componente Header */}
      <Header />
      {/* Componente Novidades (Carrossel) */}
      <NewsCarousel />
      {/* Componente Alertas da Cidade */}
      <CityAlerts />
      {/* Componente de Eventos (Carrossel) */}
      {/* <OpinionCard onVote={handleVote} /> */}
      {/* Jobs and Opportunities Card */}
      {/* <JobSuggestionCard /> */}
      <EventCarousel />
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Últimas Notícias
          </Text>
          <TouchableOpacity
            style={styles.seeMoreRow}
            onPress={() => router.push('/(tabs)/feed')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Ver mais notícias no feed"
          >
            <Text style={styles.seeMoreLabel}>Ver mais</Text>
            <Feather name="chevron-right" size={18} color={AppColors.primary} />
          </TouchableOpacity>
        </View>
        <NewsPosts maxItems={2} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={ListHeader}
        // ListFooterComponent={<NoticiasList onRefresh={onRefresh} renderAsItems={true} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
      <Toast
        key={toastKey}
        message="+25 pontos por participar!"
        visible={showToast}
        type="success"
        duration={3000}
        onHide={() => setShowToast(false)}
      />
      <CpfRequiredModal
        visible={showCpfModal}
        onClose={() => setShowCpfModal(false)}
        onCompleteProfile={() => {
          setShowCpfModal(false);
          router.push('/edit-account');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  contentContainer: {
    flexGrow: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  seeMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeMoreLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.primary,
  },
});

