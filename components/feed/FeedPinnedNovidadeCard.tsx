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
      <FeedNovidadeCardBody {...bodyProps} showPinnedLabel />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingBottom: 4,
  },
  cardDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    marginBottom: 6,
  },
});
