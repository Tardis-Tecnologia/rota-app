import { Missons } from '@/components/Missons';
import { AppColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function MissionsScreen() {
  return (
    <SafeAreaProvider style={styles.container}>
      <Missons />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
});

