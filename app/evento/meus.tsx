import EventListEmpty from '@/components/events/EventListEmpty';
import EventUpcomingCard from '@/components/events/EventUpcomingCard';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { listMyEventsWithAttendance } from '@/services/eventAttendancesService';
import type { EventListItem } from '@/utils/eventPresentation';
import { eventItemToListItem } from '@/utils/eventPresentation';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PAGE_SIZE = 20;

export default function MeusEventosScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  const loadPage = useCallback(
    async (offset: number, replace: boolean) => {
      const rows = await listMyEventsWithAttendance(offset, offset + PAGE_SIZE);
      const mapped = rows.map((r) => eventItemToListItem(r.event));
      setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = replace ? mapped.length : offsetRef.current + mapped.length;
    },
    [],
  );

  const loadInitial = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    offsetRef.current = 0;
    await loadPage(0, true);
  }, [loadPage, user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadInitial()
        .catch((e) => {
          const message = e instanceof Error ? e.message : 'Erro ao carregar seus eventos.';
          Alert.alert('Meus eventos', message);
          setItems([]);
        })
        .finally(() => setLoading(false));
    }, [loadInitial]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao atualizar.';
      Alert.alert('Meus eventos', message);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      await loadPage(offsetRef.current, false);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadPage, loading, loadingMore, user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <EventListEmpty
          icon="person-outline"
          title="Entre na sua conta"
          subtitle="Faça login para ver os eventos em que você confirmou presença."
        />
        <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Ir para login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          loading && !refreshing ? (
            <View style={styles.loader}>
              <ActivityIndicator color={AppColors.tab.active} />
            </View>
          ) : (
            <EventListEmpty
              icon="calendar-outline"
              title="Nenhuma confirmação ainda"
              subtitle='Abra um evento publicado e toque em "Vou" para vê-lo aqui.'
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loader}>
              <ActivityIndicator color={AppColors.tab.active} />
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <EventUpcomingCard item={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  cardWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerSpacer: {
    height: 24,
  },
  loginBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: AppColors.tab.active,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
