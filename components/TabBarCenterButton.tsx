import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { PlatformPressable } from 'expo-router/react-navigation';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

type TabBarCenterButtonProps = BottomTabBarButtonProps & {
  icon: IconName;
  accessibilityLabel: string;
  tabLabel?: string;
  elevate?: number;
};

export default function TabBarCenterButton(props: TabBarCenterButtonProps) {
  const {
    icon,
    accessibilityLabel,
    tabLabel,
    elevate = -40,
    accessibilityState,
    ...pressableProps
  } = props;
  const focused = accessibilityState?.selected ?? false;
  const labelColor = focused ? AppColors.tab.active : AppColors.tab.inactive;

  return (
    <PlatformPressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={[styles.wrapper, { backgroundColor: 'transparent' }, pressableProps.style]}
      onPressIn={(ev) => {
        if (Platform.OS === 'ios') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        pressableProps.onPressIn?.(ev);
      }}
    >
      <View style={[styles.content, { marginTop: elevate }]} pointerEvents="none">
        <View style={styles.button}>
          <Ionicons name={icon} size={30} color={AppColors.text.white} />
        </View>
        {tabLabel ? (
          <Text
            style={[styles.label, { color: labelColor }, focused && styles.labelFocused]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {tabLabel}
          </Text>
        ) : null}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'transparent',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.tab.active,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  label: {
    width: '100%',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  labelFocused: {
    fontWeight: '800',
  },
});
