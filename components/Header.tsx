import PointsBadge from '@/components/PointsBadge';
import { AppColors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface HeaderProps {
  nomeUsuario?: string;
  avatarUrl?: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  hasNotifications?: boolean;
}

export default function Header({
  nomeUsuario = 'Mariana Costa',
  avatarUrl = 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  onNotificationPress,
  onProfilePress,
  hasNotifications = false,
}: HeaderProps) {
  const { backgroundColor: brandColor } = useAppTheme();
  const { user } = useAuth();
  const displayName = user?.name?.trim() ? user.name : nomeUsuario;
  const resolvedAvatarUri = user?.photoUrl?.trim() || avatarUrl;

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }

    router.push('/notifications');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: brandColor }]}>
        <View style={styles.content}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingOnBrand} numberOfLines={1} ellipsizeMode="tail">
              Bem-vindo(a),
            </Text>
            <Text style={styles.nomeOnBrand} numberOfLines={1} ellipsizeMode="tail">
              {displayName}
            </Text>
          </View>

          <View style={styles.rightSection}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color={AppColors.text.white} />
                {hasNotifications ? <View style={styles.notificationDot} /> : null}
              </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => {
                if (onProfilePress) {
                  onProfilePress();
                  return;
                }
                router.push('/Profile');
              }}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: resolvedAvatarUri }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            </View>
            
            <View style={styles.badgeContainer}>
              <PointsBadge />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
    marginRight: 12,
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
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.status.success,
    borderWidth: 2,
    borderColor: AppColors.text.white,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.gray[200],
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

