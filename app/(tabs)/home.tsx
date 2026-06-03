import CityAlerts from '@/components/CityAlerts';
import CpfRequiredModal from '@/components/CpfRequiredModal';
import FeedNovidadesContent from '@/components/feed/FeedNovidadesContent';
import Header from '@/components/Header';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedNovidades } from '@/hooks/useFeedNovidades';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export default function NoticiasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, refresh: refreshUnreadCount } = useNotificationUnreadCount();
  const feed = useFeedNovidades();
  const feedRefreshRef = useRef(feed.refresh);
  feedRefreshRef.current = feed.refresh;

  const [refreshing, setRefreshing] = useState(false);
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
    void refreshUnreadCount();
    await feedRefreshRef.current();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Header hasNotifications={unreadCount > 0} />
        <View style={styles.feedBlock}>
          <CityAlerts />
          <FeedNovidadesContent feed={feed} variant="home" />
        </View>
      </ScrollView>
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
    paddingBottom: 24,
  },
  feedBlock: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
