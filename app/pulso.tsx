import { Pulso } from '@/components/Pulso';
import { AppColors } from '@/constants/theme';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function PulsoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Pulso />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
});

