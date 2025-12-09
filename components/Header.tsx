import PointsBadge from '@/components/PointsBadge';
import { AppColors } from '@/constants/theme';
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
  temNotificacao?: boolean;
}

export default function Header({
  nomeUsuario = 'Mariana Costa',
  avatarUrl = 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  onNotificationPress,
  onProfilePress,
  temNotificacao = true,
}: HeaderProps) {
  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }

    router.push('/notifications');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
              Bem-vindo(a) de volta,
            </Text>
            <Text style={styles.nome} numberOfLines={1} ellipsizeMode="tail">
              {nomeUsuario}
            </Text>
          </View>

          <View style={styles.rightSection}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color={AppColors.text.tertiary} />
                {temNotificacao && <View style={styles.notificationDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarButton}
                onPress={onProfilePress}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.badgeContainer}>
              <PointsBadge points={1250} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
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
    backgroundColor: AppColors.status.error,
    borderWidth: 2,
    borderColor: AppColors.background.default,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.gray[200],
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppColors.background.default,
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

