import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

export interface QuickAccessItem {
  id: string;
  label: string;
  icon: IconName;
}

interface ExploreFloatingCardProps {
  title?: string;
  locationName?: string;
  hasNotifications?: boolean;
  avatarUrl?: string;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
  onPressSearch?: () => void;
  quickAccessItems?: QuickAccessItem[];
  activeItemId?: string;
  onSelectQuickAccess?: (itemId: string) => void;
  style?: ViewStyle;
}

const DEFAULT_ITEMS: QuickAccessItem[] = [
  { id: 'restaurant', label: 'Restaurantes', icon: 'restaurant-outline' },
  { id: 'gas_station', label: 'Postos', icon: 'car-sport-outline' },
  { id: 'hospital', label: 'Hospital', icon: 'medkit-outline' },
  { id: 'shopping_mall', label: 'Shopping', icon: 'bag-outline' },
  { id: 'bank', label: 'Bancos', icon: 'business-outline' },
];

export function ExploreFloatingCard({
  title = 'Cidade do Futuro',
  locationName = 'Definir Distância',
  hasNotifications = true,
  avatarUrl = 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  onPressNotifications,
  onPressProfile,
  onPressSearch,
  quickAccessItems = DEFAULT_ITEMS,
  activeItemId,
  onSelectQuickAccess,
  style,
}: ExploreFloatingCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.locationButton}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={16} color={AppColors.text.tertiary} style={styles.locationIcon} />
            <Text style={styles.locationText}>{locationName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}   
          >
            <Ionicons name="notifications-outline" size={20} color={AppColors.text.secondary} />
            {hasNotifications ? <View style={styles.notificationDot} /> : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={onPressProfile}
            activeOpacity={0.7}
          >
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => router.push('/SearchTab')}
        activeOpacity={0.8}
      >
        <Ionicons name="search-outline" size={18} color={AppColors.text.secondary} />
        <Text style={styles.searchPlaceholder}>Pesquisar...</Text>
      </TouchableOpacity>

      <View style={styles.quickAccessWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAccessContent}
        >
          {quickAccessItems.map((item) => {
            const isActive = activeItemId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.quickAccessButton, isActive && styles.quickAccessButtonActive]}
                onPress={() => onSelectQuickAccess?.(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={isActive ? AppColors.text.white : AppColors.text.secondary}
                />
                <Text style={[styles.quickAccessLabel, isActive && styles.quickAccessLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  locationButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.text.tertiary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppColors.background.default,
    backgroundColor: AppColors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background.default,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 10,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  quickAccessWrapper: {
    paddingLeft: 2,
  },
  quickAccessContent: {
    gap: 10,
    paddingRight: 4,
  },
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 8,
  },
  quickAccessButtonActive: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  quickAccessLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  quickAccessLabelActive: {
    color: AppColors.text.white,
  },
});

export default ExploreFloatingCard;

