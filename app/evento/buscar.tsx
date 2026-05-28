import EventListEmpty from '@/components/events/EventListEmpty';
import EventUpcomingCard from '@/components/events/EventUpcomingCard';
import { AppColors } from '@/constants/theme';
import { getEvents } from '@/services/eventsService';
import type { EventListItem } from '@/utils/eventPresentation';
import { eventItemToListItem } from '@/utils/eventPresentation';
import { startOfLocalDay } from '@/utils/eventsCarousel';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const SEARCH_DEBOUNCE_MS = 350;

export default function BuscarEventosScreen() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [items, setItems] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestIdRef = useRef(0);

  const startDate = useMemo(() => startOfLocalDay().toISOString(), []);

  const fetchResults = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      const requestId = ++requestIdRef.current;

      if (!trimmed) {
        setApplied('');
        setItems([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setSearched(true);
      setApplied(trimmed);

      try {
        const list = await getEvents({
          init: 0,
          end: 30,
          startDate,
          title: trimmed,
        });
        if (requestId !== requestIdRef.current) return;
        setItems(list.map(eventItemToListItem));
      } catch {
        if (requestId !== requestIdRef.current) return;
        setItems([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [startDate],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      requestIdRef.current += 1;
      setApplied('');
      setItems([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      void fetchResults(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  const showInitialHint = !searched && !loading;
  const showEmptyResults = searched && !loading && items.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={20} color={AppColors.gray[500]} />
          <TextInput
            style={styles.input}
            placeholder="Nome do evento..."
            placeholderTextColor={AppColors.gray[500]}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => void fetchResults(query)}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          showInitialHint ? (
            <EventListEmpty
              icon="search-outline"
              title="Buscar na agenda"
              subtitle="Digite palavras do título do evento para encontrar na cidade."
            />
          ) : showEmptyResults ? (
            <EventListEmpty
              icon="search-outline"
              title="Nenhum resultado"
              subtitle={
                applied
                  ? `Não encontramos eventos para “${applied}”.`
                  : 'Tente outras palavras do título.'
              }
            />
          ) : loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={AppColors.tab.active} />
            </View>
          ) : null
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
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.text.secondary,
    paddingVertical: 0,
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
    paddingVertical: 48,
    alignItems: 'center',
  },
});
