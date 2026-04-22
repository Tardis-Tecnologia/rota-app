import CityAlerts from '@/components/CityAlerts';
import CpfRequiredModal from '@/components/CpfRequiredModal';
import EventCarousel from '@/components/EventCarousel';
import Header from '@/components/Header';
import NewsCarousel from '@/components/NewsCarousel';
import NewsPosts from '@/components/NewsPosts';
import OpinionCard from '@/components/OpinionCard';
import Toast from '@/components/Toast';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NoticiasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, refresh: refreshUnreadCount } = useNotificationUnreadCount();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cpfNoticeShown, setCpfNoticeShown] = useState(false);
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [voteToast, setVoteToast] = useState({ visible: false, message: '', key: 0 });

  const handleVoteSuccessToast = useCallback((message: string) => {
    setVoteToast((prev) => ({
      visible: true,
      message,
      key: prev.key + 1,
    }));
  }, []);

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
    void refreshUnreadCount();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const ListHeader = () => (
    <View>
      {/* Componente Header */}
      <Header hasNotifications={unreadCount > 0} />
      {/* Componente Novidades (Carrossel) */}
      <NewsCarousel />
      {/* Componente Alertas da Cidade */}
      <CityAlerts />
      {/* Componente de Eventos (Carrossel) */}
      <OpinionCard onVoteSuccess={handleVoteSuccessToast} />
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <ListHeader />
      </ScrollView>
      <Toast
        key={voteToast.key}
        message={voteToast.message}
        visible={voteToast.visible}
        type="success"
        duration={4000}
        onHide={() => setVoteToast((prev) => ({ ...prev, visible: false }))}
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

