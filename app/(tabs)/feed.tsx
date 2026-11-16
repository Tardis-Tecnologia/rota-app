import ForumAllPostsSection from '@/components/forum/ForumAllPostsSection';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

/** Aba Feed: todas as postagens (oficiais + da comunidade). */
export default function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken] = useState(0);

  const startRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const onRefreshComplete = useCallback(() => {
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <ForumAllPostsSection
        refreshing={refreshing}
        onRefresh={startRefresh}
        onRefreshComplete={onRefreshComplete}
        reloadToken={reloadToken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
