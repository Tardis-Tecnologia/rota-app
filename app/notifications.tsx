import Notification from '@/components/NotificationComponent';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="arrow-back-outline" size={22} color={AppColors.text.secondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 36 }} />
      </View>

      <Notification />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
    paddingHorizontal: 16,
    paddingTop: 16,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
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
    backgroundColor: AppColors.background.overlay,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
});

