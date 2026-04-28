import PointsBadge from '@/components/PointsBadge';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
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
}

export default function Header({
  nomeUsuario = 'Mariana Costa',
  avatarUrl = 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  onNotificationPress,
  onProfilePress,
  onChatPress,
  hasNotifications = false,
}: HeaderProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const displayName = user?.name?.trim() ? user.name : nomeUsuario;
  const resolvedAvatarUri = user?.photoUrl?.trim() || avatarUrl;
  const isVisitante = user?.profile === 'VISITANTE';

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
        colors={['#1D4ED8', '#2563EB', '#14B8A6']}
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
              <Text style={styles.greetingOnBrand} numberOfLines={1} ellipsizeMode="tail">
                Bem-vindo(a) de volta,
              </Text>
              <Text style={styles.nomeOnBrand} numberOfLines={1} ellipsizeMode="tail">
                {displayName}
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

          <View style={styles.pointsCardRow}>
            <PointsBadge />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  headerBg: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 18,
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
  greetingOnBrand: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  nomeOnBrand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.white,
    letterSpacing: -0.5,
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
  pointsCardRow: {
    marginTop: 14,
  },
});

