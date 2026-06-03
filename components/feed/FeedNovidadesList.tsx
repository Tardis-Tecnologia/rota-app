import FeedNovidadesContent from '@/components/feed/FeedNovidadesContent';
import { useFeedNovidades } from '@/hooks/useFeedNovidades';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

/** Lista completa do mural (aba Feed / tela dedicada). */
export default function FeedNovidadesList() {
  const feed = useFeedNovidades();

  return (
    <FlatList
      data={[{ key: 'content' }]}
      key={feed.activeFilter}
      renderItem={() => <FeedNovidadesContent feed={feed} variant="standalone" />}
      keyExtractor={(item) => item.key}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      refreshControl={
        <RefreshControl refreshing={feed.refreshing} onRefresh={() => void feed.refresh()} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f1f5f9' },
  listContent: {
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
});
