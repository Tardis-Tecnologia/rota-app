import SavedEventToastHost from '@/components/events/SavedEventToastHost';
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

export default function EventoStackLayout() {
  return (
    <>
    <SavedEventToastHost />
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: AppColors.background.default },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: AppColors.text.secondary,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="salvos"
        options={{
          headerShown: true,
          title: 'Eventos salvos',
          headerLeft: () => <HeaderBack />,
          headerRight: () => <View style={styles.headerSpacer} />,
        }}
      />
      <Stack.Screen
        name="meus"
        options={{
          headerShown: true,
          title: 'Meus eventos',
          headerLeft: () => <HeaderBack />,
          headerRight: () => <View style={styles.headerSpacer} />,
        }}
      />
      <Stack.Screen
        name="buscar"
        options={{
          headerShown: true,
          title: 'Buscar eventos',
          headerLeft: () => <HeaderBack />,
          headerRight: () => <View style={styles.headerSpacer} />,
        }}
      />
    </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  headerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  headerBtnPressed: { opacity: 0.7 },
  headerSpacer: { width: 40 },
});
