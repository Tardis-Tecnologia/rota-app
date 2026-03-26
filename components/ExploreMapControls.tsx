import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface ExploreMapControlsProps {
  bottomOffset: number;
  onCenterUser: () => void;
  onAccessibility: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ExploreMapControls({
  bottomOffset,
  onCenterUser,
  onAccessibility,
  onZoomIn,
  onZoomOut,
}: ExploreMapControlsProps) {
  return (
    <View pointerEvents="box-none" style={[styles.column, { bottom: bottomOffset }]}>
      <TouchableOpacity
        style={styles.fab}
        onPress={onCenterUser}
        activeOpacity={0.85}
        accessibilityLabel="Centralizar no mapa"
      >
        <Ionicons name="navigate-outline" size={22} color={AppColors.text.secondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab}
        onPress={onAccessibility}
        activeOpacity={0.85}
        accessibilityLabel="Acessibilidade"
      >
        <Ionicons name="accessibility-outline" size={24} color={AppColors.text.secondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab}
        onPress={onZoomIn}
        activeOpacity={0.85}
        accessibilityLabel="Aproximar mapa"
      >
        <Ionicons name="add-outline" size={26} color={AppColors.text.secondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab}
        onPress={onZoomOut}
        activeOpacity={0.85}
        accessibilityLabel="Afastar mapa"
      >
        <Ionicons name="remove-outline" size={26} color={AppColors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
    gap: 12,
    alignItems: 'center',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
});
