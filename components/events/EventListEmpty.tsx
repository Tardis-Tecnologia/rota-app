import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type EventListEmptyProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

export default function EventListEmpty({ icon, title, subtitle }: EventListEmptyProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={40} color={AppColors.gray[400]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
