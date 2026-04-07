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

export type ReportType = 'buraco' | 'dengue' | 'iluminacao' | 'lixo';

export const REPORT_SUBJECT_BY_TYPE: Record<ReportType, string> = {
  buraco: 'Buraco na via',
  dengue: 'Foco de Dengue',
  iluminacao: 'Iluminação Falha',
  lixo: 'Lixo Acumulado',
};

interface ReportButtonProps {
  onReport?: (type: ReportType) => void;
  bottomOffset?: number;
}

interface ReportOption {
  id: ReportType;
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap | keyof typeof Ionicons.glyphMap;
  iconFamily: 'MaterialIcons' | 'Ionicons';
  iconColor: string;
}

const getReportOptions = (): ReportOption[] => [
  {
    id: 'buraco',
    label: REPORT_SUBJECT_BY_TYPE.buraco,
    iconName: 'block',
    iconFamily: 'MaterialIcons',
    iconColor: AppColors.report.orange,
  },
  {
    id: 'dengue',
    label: REPORT_SUBJECT_BY_TYPE.dengue,
    iconName: 'bug',
    iconFamily: 'Ionicons',
    iconColor: AppColors.report.red,
  },
  {
    id: 'iluminacao',
    label: REPORT_SUBJECT_BY_TYPE.iluminacao,
    iconName: 'lightbulb-outline',
    iconFamily: 'MaterialIcons',
    iconColor: AppColors.report.amber,
  },
  {
    id: 'lixo',
    label: REPORT_SUBJECT_BY_TYPE.lixo,
    iconName: 'trash-outline',
    iconFamily: 'Ionicons',
    iconColor: AppColors.report.gray,
  },
];

export default function ReportButton({ onReport, bottomOffset = 24 }: ReportButtonProps) {
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
    <View style={[styles.container, { bottom: bottomOffset }]}>
      {/* Menu Dropdown */}
      {isMenuOpen && (
        <Animated.View style={[styles.menu, menuAnimatedStyle]}>
          {getReportOptions().map((option) => (
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

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleMenu}
          activeOpacity={0.8}
          accessibilityLabel="Reportar à Prefeitura"
        >
          <Ionicons name="megaphone-outline" size={24} color={AppColors.text.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pill}
          onPress={toggleMenu}
          activeOpacity={0.85}
        >
          <Text style={styles.pillText}>Reportar à Prefeitura</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    zIndex: 1000,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: AppColors.background.default,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: 220,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  menu: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: AppColors.shadow,
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

