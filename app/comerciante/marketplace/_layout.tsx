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

export default function ComercianteMarketplaceLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Marketplace' }} />
      <Stack.Screen name="[id]" options={{ title: 'Produto' }} />
      <Stack.Screen
        name="publicar"
        options={{
          title: 'Novo anúncio',
          headerStyle: { backgroundColor: '#f1f5f9' },
        }}
      />
      <Stack.Screen name="editar/[id]" options={{ title: 'Editar anúncio' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  headerBtnPressed: { opacity: 0.7 },
  headerSpacer: { width: 40 },
});
