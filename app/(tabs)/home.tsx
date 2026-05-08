import CityAlerts from '@/components/CityAlerts';
import CpfRequiredModal from '@/components/CpfRequiredModal';
import EventCarousel from '@/components/EventCarousel';
import HomeReportedProblemsSection from '@/components/HomeReportedProblemsSection';
import Header from '@/components/Header';
import { ModalEmergencyPhones } from '@/components/ModalEmergencyPhones';
import NewsCarousel from '@/components/NewsCarousel';
import NewsPosts from '@/components/NewsPosts';
import OpinionCard from '@/components/OpinionCard';
import Realtime from '@/components/Realtime';
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
  const [homePulseRefreshKey, setHomePulseRefreshKey] = useState(0);
  const [cpfNoticeShown, setCpfNoticeShown] = useState(false);
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [showEmergencyPhones, setShowEmergencyPhones] = useState(false);
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
    setHomePulseRefreshKey((k) => k + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const ListHeader = () => (
    <View>
      {/* Componente Header */}
      <Header hasNotifications={unreadCount > 0} />
      {/* Componente Alertas da Cidade */}
      <CityAlerts />
      {/* Componente Agora no seu bairro */}
      <Realtime />
      {/* Acesso rápido */}
      <View style={styles.quickAccessSection}>
        <Text style={styles.quickAccessTitle}>ACESSO RÁPIDO</Text>
        <View style={styles.quickAccessRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.quickAccessCard}
            accessibilityRole="button"
            accessibilityLabel="Missões"
            onPress={() => router.push('/missions')}
          >
            <View style={[styles.quickAccessIconWrap, { backgroundColor: '#7C3AED' }]}>
              <Feather name="target" size={22} color={AppColors.text.white} />
            </View>
            <Text style={styles.quickAccessLabel}>Missões</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.quickAccessCard}
            accessibilityRole="button"
            accessibilityLabel="Pulso"
            onPress={() => router.push('/pulso')}
          >
            <View style={[styles.quickAccessIconWrap, { backgroundColor: '#10B981' }]}>
              <Feather name="activity" size={22} color={AppColors.text.white} />
            </View>
            <Text style={styles.quickAccessLabel}>Pulso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.quickAccessCard}
            accessibilityRole="button"
            accessibilityLabel="Emergência"
            onPress={() => setShowEmergencyPhones(true)}
          >
            <View style={[styles.quickAccessIconWrap, { backgroundColor: '#EF4444' }]}>
              <Feather name="phone-call" size={22} color={AppColors.text.white} />
            </View>
            <Text style={styles.quickAccessLabel}>Emergência</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Componente Novidades (Carrossel) */}
      <NewsCarousel />
      {/* Componente de Eventos (Carrossel) */}
      <OpinionCard onVoteSuccess={handleVoteSuccessToast} />
      {/* Jobs and Opportunities Card */}
      {/* <JobSuggestionCard /> */}
      <HomeReportedProblemsSection refreshKey={homePulseRefreshKey} />
      <EventCarousel />
      <View>
        <View style={styles.newsHeaderRow}>
          <View style={styles.newsHeaderLeft}>
            <View style={styles.newsKickerRow}>
              <Text style={styles.newsKicker}>CANAL OFICIAL</Text>
              <Feather name="file-text" size={14} color={AppColors.text.tertiary} />
            </View>
            <Text style={styles.newsTitle} numberOfLines={1}>
              Últimas notícias
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newsHeaderCta}
            onPress={() => router.push('/(tabs)/feed')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Ver todas as notícias"
          >
            <Text style={styles.newsHeaderCtaText}>Ver todos</Text>
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
      <ModalEmergencyPhones
        visible={showEmergencyPhones}
        onClose={() => setShowEmergencyPhones(false)}
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
  newsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 16,
  },
  newsHeaderLeft: {
    flex: 1,
  },
  newsKicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: AppColors.text.tertiary,
    marginBottom: 6,
  },
  newsKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  newsHeaderCta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 200, 0.35)',
    backgroundColor: 'rgba(0, 210, 200, 0.10)',
  },
  newsHeaderCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.tab.active,
  },

  quickAccessSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  quickAccessTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: AppColors.text.tertiary,
    marginBottom: 12,
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  quickAccessIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickAccessLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
});

