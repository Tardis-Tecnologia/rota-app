import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
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
  /** Cor do ícone (protótipo ROTA) */
  iconColor?: string;
}

interface ExploreFloatingCardProps {
  hasNotifications?: boolean;
  avatarUrl?: string;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
  onPressSearch?: () => void;
  quickAccessItems?: QuickAccessItem[];
  activeItemId?: string;
  onSelectQuickAccess?: (itemId: string) => void;
  filterLoading?: boolean;
  style?: ViewStyle;
}

const DEFAULT_ITEMS: QuickAccessItem[] = [
  { id: 'hospital', label: 'Hospitais', icon: 'medkit-outline', iconColor: '#db2777' },
  { id: 'school', label: 'Escolas', icon: 'school-outline', iconColor: '#1e40af' },
  { id: 'restaurant', label: 'Restaurantes', icon: 'restaurant-outline', iconColor: '#dc2626' },
  { id: 'pharmacy', label: 'Farmácias', icon: 'medkit-outline', iconColor: '#16a34a' },
  { id: 'market', label: 'Mercados', icon: 'basket-outline', iconColor: '#d97706' },
  { id: 'prestador', label: 'Prestadores', icon: 'construct-outline', iconColor: '#0d9488' },
  { id: 'partner_stores', label: 'Parceiros', icon: 'storefront-outline', iconColor: '#b45309' },
  { id: 'communities', label: 'Comunidades', icon: 'people-outline', iconColor: '#0891b2' },
  { id: 'events', label: 'Eventos', icon: 'calendar-outline', iconColor: '#7c3aed' },
  { id: 'bakery', label: 'Padarias', icon: 'pizza-outline', iconColor: '#a16207' },
  { id: 'gas_station', label: 'Postos', icon: 'car-outline', iconColor: '#b45309' },
];

export function ExploreFloatingCard({
  hasNotifications = true,
  avatarUrl = 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  onPressNotifications,
  onPressProfile,
  onPressSearch,
  quickAccessItems = DEFAULT_ITEMS,
  activeItemId,
  onSelectQuickAccess,
  filterLoading = false,
  style,
}: ExploreFloatingCardProps) {
  const { user } = useAuth();
  const resolvedAvatarUri = user?.photoUrl?.trim() || avatarUrl;
  const isVisitante = user?.profile === 'VISITANTE';
  const items = useMemo(() => quickAccessItems, [quickAccessItems]);

  const goSearch = () => {
    onPressSearch?.();
    router.push('/SearchTab');
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.titleLineDark}>O que você gostaria de</Text>
          <Text style={styles.titleLineAccent}>encontrar hoje?</Text>
        </View>

        <View style={styles.actionsRow}>
          {!isVisitante ? (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => onPressNotifications?.() ?? router.push('/notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={AppColors.text.secondary} />
              {hasNotifications ? <View style={styles.notificationDot} /> : null}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => onPressProfile?.() ?? router.push('/Profile')}
            activeOpacity={0.7}
          >
            <Image source={{ uri: resolvedAvatarUri }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchField}
          onPress={goSearch}
          activeOpacity={0.85}
        >
          <Ionicons name="search-outline" size={20} color={AppColors.text.tertiary} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Busque por prestadores, locais, rotas…
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchSubmit}
          onPress={goSearch}
          activeOpacity={0.85}
          accessibilityLabel="Ir para busca"
          disabled={filterLoading}
        >
          {filterLoading ? (
            <ActivityIndicator size="small" color={AppColors.text.white} />
          ) : (
            <Ionicons name="arrow-forward" size={22} color={AppColors.text.white} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.chipsBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
          style={styles.chipsScroll}
        >
          {items.map((item) => {
            const isActive = activeItemId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, isActive && styles.chipActive, filterLoading && styles.chipDisabled]}
                onPress={() => onSelectQuickAccess?.(item.id)}
                activeOpacity={0.85}
                disabled={filterLoading}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={item.iconColor ?? AppColors.text.secondary}
                />
                <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]} numberOfLines={1}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
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
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  titleLineDark: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.primary,
    lineHeight: 24,
  },
  titleLineAccent: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.background.lightBlue,
    lineHeight: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: AppColors.background.muted,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.status.success,
    borderWidth: 2,
    borderColor: AppColors.background.default,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppColors.background.default,
    backgroundColor: AppColors.gray[200],
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background.muted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  searchSubmit: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.background.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  chipsBlock: {
    marginTop: 2,
  },
  chipsScroll: {
    marginHorizontal: -6,
  },
  chipsScrollContent: {
    paddingHorizontal: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.background.default,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
    maxWidth: '100%',
  },
  chipActive: {
    backgroundColor: AppColors.palette.sky.light,
    borderColor: AppColors.tab.active,
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  chipLabelActive: {
    color: AppColors.tab.active,
  },
});

export default ExploreFloatingCard;
