import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ColorValue, StyleSheet, Text, View } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabBarItemProps {
  label: string;
  icon: IconName;
  color: ColorValue;
  focused: boolean;
}

export default function TabBarItem({ label, icon, color, focused }: TabBarItemProps) {
  const iconColor = focused ? AppColors.tab.active : AppColors.tab.inactive;

  return (
    <View style={styles.root}>
      <Ionicons name={icon} size={22} color={iconColor} />
      <Text
        style={[styles.label, { color }, focused && styles.labelFocused]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    width: '100%',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 1,
    includeFontPadding: false,
  },
  labelFocused: {
    fontWeight: '800',
  },
});
