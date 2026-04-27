import { AppColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

export function SectionTitle({
  title,
  style,
}: {
  title: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: AppColors.text.secondary,
    textTransform: 'uppercase',
  },
});

