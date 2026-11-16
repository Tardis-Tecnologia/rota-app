import CityAlerts from '@/components/CityAlerts';
import PointsBadge from '@/components/PointsBadge';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCityBrand } from '@/contexts/CityBrandContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  nomeUsuario?: string;
  avatarUrl?: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onChatPress?: () => void;
  hasNotifications?: boolean;
  alertsReloadToken?: number;
}

export default function Header({
  nomeUsuario = 'Mariana Costa',
  avatarUrl = 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  onNotificationPress,
  onProfilePress,
  onChatPress,
  hasNotifications = false,
  alertsReloadToken = 0,
}: HeaderProps) {
  const { user } = useAuth();
  const brand = useCityBrand();
  const insets = useSafeAreaInsets();
  const resolvedAvatarUri = user?.photoUrl?.trim() || avatarUrl;
  const isVisitante = user?.profile === 'VISITANTE';
  const firstName =
    user?.name?.trim().split(/\s+/).filter(Boolean)[0] ||
    nomeUsuario.trim().split(/\s+/).filter(Boolean)[0] ||
    'cidadão';

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }

    router.push('/notifications');
  };

  const handleChatPress = () => {
    if (onChatPress) {
      onChatPress();
      return;
    }
    router.push('/(tabs)/messages');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={brand.gradient}
        start={{ x: 0.1, y: 0.05 }}
        end={{ x: 0.9, y: 0.95 }}
        style={[styles.headerBg, { paddingTop: Math.max(insets.top, 16) + 10 }]}
      >
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => {
                if (onProfilePress) {
                  onProfilePress();
                  return;
                }
                router.push('/Profile');
              }}
              activeOpacity={0.75}
            >
              <Image source={{ uri: resolvedAvatarUri }} style={styles.avatar} />
            </TouchableOpacity>

            <View style={styles.greetingContainer}>
              <Text style={styles.welcomeMessage} numberOfLines={1} ellipsizeMode="tail">
                Olá, {firstName}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={handleChatPress}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Abrir mensagens"
              >
                <Ionicons name="chatbubble-outline" size={20} color={AppColors.text.white} />
              </TouchableOpacity>

              {!isVisitante ? <PointsBadge variant="icon" /> : null}

              {!isVisitante ? (
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={handleNotificationPress}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir notificações"
                >
                  <Ionicons name="notifications-outline" size={20} color={AppColors.text.white} />
                  {hasNotifications ? <View style={styles.notificationDot} /> : null}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <CityAlerts variant="header" reloadToken={alertsReloadToken} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
  },
  headerBg: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingContainer: {
    flex: 1,
    minWidth: 0,
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.white,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.status.success,
    borderWidth: 2,
    borderColor: AppColors.text.white,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppColors.text.white,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
