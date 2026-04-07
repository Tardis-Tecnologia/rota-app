import EditInfoUser from '@/components/EditInfoUser';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditAccountScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={AppColors.text.secondary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Minha conta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <EditInfoUser />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.overlayPressed,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  headerSpacer: {
    width: 36,
  },
});
