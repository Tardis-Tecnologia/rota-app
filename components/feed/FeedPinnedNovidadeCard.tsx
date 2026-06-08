import FeedNovidadeCardBody, {
  type FeedNovidadeCardBodyProps,
} from '@/components/feed/FeedNovidadeCardBody';
import { AppColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type FeedPinnedNovidadeCardProps = FeedNovidadeCardBodyProps & {
  style?: StyleProp<ViewStyle>;
};

export default function FeedPinnedNovidadeCard({
  style,
  ...bodyProps
}: FeedPinnedNovidadeCardProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.shell}>
        <View
          style={styles.topBar}
          accessibilityRole="text"
          accessibilityLabel="Postagem fixada pela Prefeitura"
        >
          <MaterialIcons name="push-pin" size={16} color="#ffffff" />
          <Text style={styles.topBarText} numberOfLines={1}>
            POSTAGEM FIXADA PELA PREFEITURA
          </Text>
        </View>

        <View style={styles.body}>
          <FeedNovidadeCardBody {...bodyProps} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 8,
    borderBottomColor: '#eef2f6',
  },
  shell: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: AppColors.primary,
  },
  topBarText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.7,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
});
