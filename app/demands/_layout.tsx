import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

function HeaderBack() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
      hitSlop={8}
    >
      <Ionicons name="arrow-back-outline" size={24} color="#000" />
    </Pressable>
  );
}

const headerTitleStyle = {
  fontSize: 18,
  fontWeight: '700' as const,
  color: '#000',
};

export default function DemandsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerShadowVisible: false,
        headerLeft: () => <HeaderBack />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Realizações' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnPressed: {
    opacity: 0.6,
  },
});
