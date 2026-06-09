import FeedNovidadeCardBody, {
  type FeedNovidadeCardBodyProps,
} from '@/components/feed/FeedNovidadeCardBody';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type FeedPinnedNovidadeCardProps = FeedNovidadeCardBodyProps & {
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
};

export default function FeedPinnedNovidadeCard({
  style,
  showDivider = true,
  ...bodyProps
}: FeedPinnedNovidadeCardProps) {
  return (
    <View style={[styles.card, showDivider && styles.cardDivider, style]}>
      <View style={styles.inner}>
        <FeedNovidadeCardBody {...bodyProps} showPinnedLabel />
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
