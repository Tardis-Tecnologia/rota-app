import { AppColors } from '@/constants/theme';
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
      <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
    </Pressable>
  );
}

export default function GuiaLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: AppColors.background.default },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
          color: AppColors.text.secondary,
        },
        headerShadowVisible: false,
        headerLeft: () => <HeaderBack />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Guia da Cidade',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalhes',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="cadastro-prestador"
        options={{
          title: 'Cadastro de prestador',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 8, marginLeft: 4 },
  headerBtnPressed: { opacity: 0.7 },
});
