import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ComercianteSectionBannerProps = {
  title: string;
  description: string;
};

export default function ComercianteSectionBanner({
  title,
  description,
}: ComercianteSectionBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#e0f2fe',
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(14, 116, 144, 0.12)',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
});
