import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type MapPointMarkerDotProps = {
  color: string;
};

export default function MapPointMarkerDot({ color }: MapPointMarkerDotProps) {
  return (
    <View
      style={[styles.dot, { backgroundColor: color }]}
      collapsable={Platform.OS === 'android' ? false : undefined}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
