import FeedNovidadeCardBody, {
  type FeedNovidadeCardBodyProps,
} from '@/components/feed/FeedNovidadeCardBody';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type FeedNovidadeCardProps = FeedNovidadeCardBodyProps & {
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
};

export default function FeedNovidadeCard({
  style,
  showDivider = true,
  ...bodyProps
}: FeedNovidadeCardProps) {
  return (
    <View style={[styles.card, showDivider && styles.cardDivider, style]}>
      <View style={styles.inner}>
        <FeedNovidadeCardBody {...bodyProps} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
  },
  cardDivider: {
    borderBottomWidth: 8,
    borderBottomColor: '#eef2f6',
  },
  inner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
