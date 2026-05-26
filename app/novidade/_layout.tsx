import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

function HeaderBack() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
      hitSlop={8}
    >
      <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
    </Pressable>
  );
}

export default function NovidadeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: AppColors.background.default },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
          color: AppColors.text.secondary,
        },
        headerShadowVisible: false,
        headerLeft: () => <HeaderBack />,
        headerRight: () => <View style={styles.headerSpacer} />,
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Comunicado' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  headerBtnPressed: { opacity: 0.7 },
  headerSpacer: { width: 40 },
});
