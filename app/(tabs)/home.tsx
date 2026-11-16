import CpfRequiredModal from '@/components/CpfRequiredModal';
import FeedNovidadesContent from '@/components/feed/FeedNovidadesContent';
import ForumAllPostsSection from '@/components/forum/ForumAllPostsSection';
import Header from '@/components/Header';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedNovidades } from '@/hooks/useFeedNovidades';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { subscribeTabReselect } from '@/utils/tabReselect';

/**
 * Página principal: só conteúdo oficial da Prefeitura.
 * - Filtros de novidades (notícias, enquetes, obras, lazer)
 * - Publicações oficiais do mural
 * Postagens da comunidade ficam na aba Feed.
 */
export default function NoticiasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, refresh: refreshUnreadCount } = useNotificationUnreadCount();
  const feed = useFeedNovidades();
  const feedRefreshRef = useRef(feed.refresh);
  feedRefreshRef.current = feed.refresh;

  const [refreshing, setRefreshing] = useState(false);
  const [alertsReloadToken, setAlertsReloadToken] = useState(0);
  const [officialReloadToken, setOfficialReloadToken] = useState(0);
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
    setAlertsReloadToken((token) => token + 1);
    setOfficialReloadToken((token) => token + 1);
    void refreshUnreadCount();
    await feedRefreshRef.current();
    setRefreshing(false);
  };

  const scrollRef = useRef<ScrollView>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    return subscribeTabReselect('home', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      void onRefreshRef.current();
    });
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Header hasNotifications={unreadCount > 0} alertsReloadToken={alertsReloadToken} />
        <View style={styles.feedBlock}>
          <FeedNovidadesContent feed={feed} variant="home" />
          <ForumAllPostsSection
            officialOnly
            embedded
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            onRefreshComplete={() => setRefreshing(false)}
            reloadToken={officialReloadToken}
          />
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
