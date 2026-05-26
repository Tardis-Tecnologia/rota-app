import FeedNovidadesList from '@/components/feed/FeedNovidadesList';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <FeedNovidadesList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
});
