import { AppColors } from '@/constants/theme';
import { listCommercialStoresForMap } from '@/services/commercialStoreApi';
import { getEvents } from '@/services/eventsService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type EventOption = { id: string; title: string };
type StoreOption = { id: string; name: string };

type ForumPublishTagsProps = {
  event: EventOption | null;
  store: StoreOption | null;
  onChangeEvent: (value: EventOption | null) => void;
  onChangeStore: (value: StoreOption | null) => void;
};

export default function ForumPublishTags({
  event,
  store,
  onChangeEvent,
  onChangeStore,
}: ForumPublishTagsProps) {
  const [open, setOpen] = useState<'event' | 'store' | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventOption[] | null>(null);
  const [stores, setStores] = useState<StoreOption[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      if (open === 'event' && events) return;
      if (open === 'store' && stores) return;
      setLoading(true);
      setError(null);
      try {
        if (open === 'event' && !events) {
          const rows = await getEvents({ status: 'published', init: 0, end: 40 });
          if (cancelled) return;
          setEvents(
            rows
              .map((row) => ({ id: row.id, title: row.title.trim() || 'Evento' }))
              .filter((row) => row.id),
          );
        }
        if (open === 'store' && !stores) {
          const rows = await listCommercialStoresForMap();
          if (cancelled) return;
          setStores(rows.map((row) => ({ id: row.id, name: row.storeName })));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Não foi possível carregar a lista.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [events, open, stores]);

  const options = useMemo(() => {
    const source =
      open === 'event'
        ? (events ?? []).map((item) => ({ id: item.id, label: item.title, kind: 'event' as const }))
        : (stores ?? []).map((item) => ({ id: item.id, label: item.name, kind: 'store' as const }));
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((item) => item.label.toLowerCase().includes(needle));
  }, [events, open, query, stores]);

  const toggle = (kind: 'event' | 'store') => {
    setQuery('');
    setError(null);
    setOpen((current) => (current === kind ? null : kind));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          style={[styles.pickBtn, event && styles.pickBtnActive]}
          onPress={() => toggle('event')}
        >
          <Ionicons name="calendar-outline" size={16} color={AppColors.text.secondary} />
          <Text style={styles.pickText} numberOfLines={1}>
            {event ? event.title : 'Marcar evento'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.pickBtn, store && styles.pickBtnActive]}
          onPress={() => toggle('store')}
        >
          <Ionicons name="storefront-outline" size={16} color={AppColors.text.secondary} />
          <Text style={styles.pickText} numberOfLines={1}>
            {store ? store.name : 'Marcar empresa'}
          </Text>
        </Pressable>
      </View>

      {event ? (
        <Pressable style={styles.clear} onPress={() => onChangeEvent(null)}>
          <Text style={styles.clearText}>Remover evento</Text>
        </Pressable>
      ) : null}
      {store ? (
        <Pressable style={styles.clear} onPress={() => onChangeStore(null)}>
          <Text style={styles.clearText}>Remover empresa</Text>
        </Pressable>
      ) : null}

      {open ? (
        <View style={styles.panel}>
          <TextInput
            style={styles.search}
            placeholder={open === 'event' ? 'Buscar evento' : 'Buscar empresa'}
            value={query}
            onChangeText={setQuery}
          />
          {loading ? <ActivityIndicator color={AppColors.tab.active} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!loading && !error && options.length === 0 ? (
            <Text style={styles.empty}>Nenhum resultado.</Text>
          ) : null}
          <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {options.map((item) => {
              const selected = item.kind === 'event' ? event?.id === item.id : store?.id === item.id;
              return (
                <Pressable
                  key={`${item.kind}-${item.id}`}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    if (item.kind === 'event') onChangeEvent({ id: item.id, title: item.label });
                    else onChangeStore({ id: item.id, name: item.label });
                    setOpen(null);
                  }}
                >
                  <Text style={styles.optionText} numberOfLines={2}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  pickBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickBtnActive: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  pickText: { flex: 1, color: AppColors.text.secondary, fontWeight: '700', fontSize: 13 },
  clear: { alignSelf: 'flex-start' },
  clearText: { color: AppColors.text.tertiary, fontSize: 12, fontWeight: '700' },
  panel: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    padding: 8,
    gap: 8,
  },
  search: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: AppColors.text.secondary,
  },
  list: { maxHeight: 160 },
  option: { paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8 },
  optionSelected: { backgroundColor: '#f0fdfa' },
  optionText: { color: AppColors.text.secondary, fontSize: 14, fontWeight: '600' },
  empty: { color: AppColors.text.tertiary, fontSize: 13 },
  error: { color: '#b91c1c', fontSize: 13 },
});
