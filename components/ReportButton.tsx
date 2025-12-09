import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

type ReportType = 'buraco' | 'dengue' | 'iluminacao' | 'lixo';

interface ReportButtonProps {
  onReport?: (type: ReportType) => void;
}

interface ReportOption {
  id: ReportType;
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap | keyof typeof Ionicons.glyphMap;
  iconFamily: 'MaterialIcons' | 'Ionicons';
  iconColor: string;
}

const reportOptions: ReportOption[] = [
  {
    id: 'buraco',
    label: 'Buraco na via',
    iconName: 'block',
    iconFamily: 'MaterialIcons',
    iconColor: '#f97316', // orange-500
  },
  {
    id: 'dengue',
    label: 'Foco de Dengue',
    iconName: 'bug',
    iconFamily: 'Ionicons',
    iconColor: '#ef4444', // red-500
  },
  {
    id: 'iluminacao',
    label: 'Iluminação Falha',
    iconName: 'lightbulb-outline',
    iconFamily: 'MaterialIcons',
    iconColor: '#f59e0b', // amber-500
  },
  {
    id: 'lixo',
    label: 'Lixo Acumulado',
    iconName: 'trash-outline',
    iconFamily: 'Ionicons',
    iconColor: '#6b7280', // gray-500
  },
];

export default function ReportButton({ onReport }: ReportButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuAnimation = useSharedValue(0);
  const menuOpacity = useSharedValue(0);

  useEffect(() => {
    if (isMenuOpen) {
      menuOpacity.value = withTiming(1, { duration: 100 });
      menuAnimation.value = withTiming(0, { duration: 100 });
    } else {
      menuOpacity.value = withTiming(0, { duration: 100 });
      menuAnimation.value = withTiming(20, { duration: 100 });
    }
  }, [isMenuOpen, menuAnimation, menuOpacity]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleReportPress = (type: ReportType) => {
    if (onReport) {
      onReport(type);
    }
    setIsMenuOpen(false);
  };

  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      transform: [{ translateY: menuAnimation.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Menu Dropdown */}
      {isMenuOpen && (
        <Animated.View style={[styles.menu, menuAnimatedStyle]}>
          {reportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.menuItem}
              onPress={() => handleReportPress(option.id)}
              activeOpacity={0.7}
            >
              {option.iconFamily === 'MaterialIcons' ? (
                <MaterialIcons
                  name={option.iconName as keyof typeof MaterialIcons.glyphMap}
                  size={24}
                  color={option.iconColor}
                />
              ) : (
                <Ionicons
                  name={option.iconName as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={option.iconColor}
                />
              )}
              <Text style={styles.menuItemText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Ionicons name="megaphone-outline" size={24} color={AppColors.text.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menu: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.text.primary,
    flex: 1,
  },
});

