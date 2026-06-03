import { Stack } from 'expo-router';
import React from 'react';

export default function EnquetesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
