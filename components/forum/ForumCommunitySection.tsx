import CommunitySegmentTabs from '@/components/forum/CommunitySegmentTabs';
import ForumCommunityCard from '@/components/forum/ForumCommunityCard';
import { AppColors } from '@/constants/theme';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import { listForumCommunities, listMyForumCommunities, listFollowingForumCommunities, mergeMyAndFollowingCommunities, type ForumCommunityListItem } from '@/services/forumCommunityApi';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const SEGMENTS = [{ key: 'explore', label: 'Explorar' }, { key: 'mine', label: 'Minhas' }];
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function loadAllCommunities(fetchPage: (options: { init: number; end: number }) => Promise<ForumCommunityListItem[]>) {
  const items = new Map<string, ForumCommunityListItem>();
  for (let init = 0; ; init += 50) {
    const page = await fetchPage({ init, end: init + 50 });
    const previousSize = items.size;
    page.forEach((item) => items.set(item.id, item));
    if (page.length < 50 || items.size === previousSize) return [...items.values()];
  }
}

interface ForumCommunitySectionProps {
  refreshing: boolean;
  onRefresh: () => void;
  onRefreshComplete?: () => void;
}

export default function ForumCommunitySection({ refreshing, onRefresh, onRefreshComplete }: ForumCommunitySectionProps) {
  const isVisitante = useIsVisitante();
  const [activeTab, setActiveTab] = useState('explore');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ForumCommunityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageEpoch, setImageEpoch] = useState(Date.now);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setError(null);
    try {
      const rows = activeTab === 'explore'
        ? await loadAllCommunities((page) => listForumCommunities(undefined, page))
        : await Promise.all([
            loadAllCommunities(listMyForumCommunities),
            loadAllCommunities(listFollowingForumCommunities),
          ]).then(([mine, following]) => mergeMyAndFollowingCommunities(mine, following));
      if (request !== requestRef.current) return;
      setItems(rows);
      setImageEpoch(Date.now());
    } catch (e) {
      if (request === requestRef.current) setError(e instanceof Error ? e.message : 'Não foi possível carregar as comunidades.');
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setItems([]);
    void load();
    return () => { requestRef.current += 1; };
  }, [load]));

  const filtered = useMemo(() => {
    const term = normalizeSearch(query.trim());
    return items.filter((item) => normalizeSearch(`${item.name} ${item.description ?? ''} ${item.category ?? ''}`).includes(term));
  }, [items, query]);

  return (
    <View style={styles.wrap}>
      <CommunitySegmentTabs options={SEGMENTS} active={activeTab} onSelect={setActiveTab} />
      <View style={styles.search}>
        <Ionicons name="search-outline" size={20} color={AppColors.text.tertiary} />
        <TextInput style={styles.searchInput} placeholder="Buscar comunidades"
          placeholderTextColor={AppColors.text.quaternary} accessibilityLabel="Buscar comunidades"
          value={query} onChangeText={setQuery} autoCorrect={false} returnKeyType="search" />
        {query ? <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={AppColors.text.tertiary} />
        </Pressable> : null}
      </View>
      <FlatList data={loading ? [] : filtered} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        refreshing={refreshing} onRefresh={() => { onRefresh(); void load().finally(onRefreshComplete); }}
        renderItem={({ item }) => <ForumCommunityCard item={item} imageEpoch={imageEpoch}
          onPress={() => router.push({ pathname: '/forum/communities/feed', params: { id: item.id } })} />}
        ListHeaderComponent={error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        ListEmptyComponent={loading ? <ActivityIndicator style={styles.empty} color={AppColors.primary} /> : error ? null : (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={AppColors.text.quaternary} />
            <Text style={styles.emptyTitle}>{query.trim() ? 'Nenhuma comunidade encontrada' : 'Nenhuma comunidade por aqui'}</Text>
            <Text style={styles.hint}>{query.trim() ? 'Tente buscar por outro nome ou assunto.' : activeTab === 'mine' ? 'As comunidades que você cria, participa ou segue aparecem aqui.' : 'Crie uma comunidade para reunir pessoas com interesses em comum.'}</Text>
          </View>
        )} />
      <Pressable accessibilityRole="button" accessibilityLabel="Criar comunidade" collapsable={false}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        onPress={() => {
          if (isVisitante) { promptVisitanteLogin('criar comunidades'); return; }
          router.push('/forum/communities/create');
        }}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f1f5f9' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: AppColors.text.primary },
  list: { paddingBottom: 96 },
  empty: { padding: 28, alignItems: 'center', gap: 10 },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: AppColors.text.secondary, textAlign: 'center' },
  hint: { color: AppColors.text.tertiary, textAlign: 'center', lineHeight: 20 },
  error: { padding: 16, color: AppColors.status.error },
  fab: { position: 'absolute', right: 16, bottom: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14 },
});
