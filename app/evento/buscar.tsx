import EventListEmpty from '@/components/events/EventListEmpty';
import EventUpcomingCard from '@/components/events/EventUpcomingCard';
import { AppColors } from '@/constants/theme';
import { getEvents } from '@/services/eventsService';
import type { EventListItem } from '@/utils/eventPresentation';
import { eventItemToListItem } from '@/utils/eventPresentation';
import { startOfLocalDay } from '@/utils/eventsCarousel';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function BuscarEventosScreen() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [items, setItems] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const startDate = useMemo(() => startOfLocalDay().toISOString(), []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    setApplied(q);
    setSearched(true);
    if (!q) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const list = await getEvents({
        init: 0,
        end: 30,
        startDate,
        title: q,
      });
      setItems(list.map(eventItemToListItem));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query, startDate]);

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
            onSubmitEditing={() => void runSearch()}
          />
        </View>
        <Pressable style={styles.searchBtn} onPress={() => void runSearch()}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={AppColors.tab.active} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searched ? (
              <EventListEmpty
                icon="search-outline"
                title="Nenhum resultado"
                subtitle={
                  applied
                    ? `Não encontramos eventos para “${applied}”.`
                    : 'Digite o nome do evento e toque em Buscar.'
                }
              />
            ) : (
              <EventListEmpty
                icon="search-outline"
                title="Buscar na agenda"
                subtitle="Digite palavras do título do evento para encontrar na cidade."
              />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <EventUpcomingCard item={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  inputWrap: {
    flex: 1,
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
  searchBtn: {
    backgroundColor: AppColors.tab.active,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
