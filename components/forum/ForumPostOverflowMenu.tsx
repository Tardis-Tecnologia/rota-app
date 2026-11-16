import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type ForumPostOverflowAnchor = {
  top: number;
  left: number;
  width: number;
};

interface ForumPostOverflowMenuProps {
  visible: boolean;
  anchor: ForumPostOverflowAnchor | null;
  canViewProfile: boolean;
  canReport?: boolean;
  canDelete?: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onReport: () => void;
  onDelete?: () => void;
}

const MENU_WIDTH = 196;

export default function ForumPostOverflowMenu({
  visible,
  anchor,
  canViewProfile,
  canReport = true,
  canDelete = false,
  onClose,
  onViewProfile,
  onReport,
  onDelete,
}: ForumPostOverflowMenuProps) {
  if (!visible || !anchor) return null;

  const left = Math.max(12, anchor.left + anchor.width - MENU_WIDTH);
  const top = anchor.top + 6;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar menu" />
      <View style={[styles.menu, { top, left, width: MENU_WIDTH }]} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            onClose();
            onViewProfile();
          }}
          disabled={!canViewProfile}
          style={({ pressed }) => [
            styles.menuItem,
            !canViewProfile && styles.menuItemDisabled,
            pressed && canViewProfile && styles.menuItemPressed,
          ]}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={canViewProfile ? AppColors.text.secondary : AppColors.text.quaternary}
          />
          <Text style={[styles.menuItemText, !canViewProfile && styles.menuItemTextDisabled]}>
            Ver perfil
          </Text>
        </Pressable>

        {canDelete && onDelete ? (
          <>
            <View style={styles.menuDivider} />
            <Pressable
              onPress={() => {
                onClose();
                onDelete();
              }}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <Ionicons name="trash-outline" size={20} color={AppColors.status.error} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Excluir publicação</Text>
            </Pressable>
          </>
        ) : null}

        {canReport ? (
          <>
            <View style={styles.menuDivider} />
            <Pressable
              onPress={() => {
                onClose();
                onReport();
              }}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <Ionicons name="flag-outline" size={20} color={AppColors.status.error} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Denunciar post</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemPressed: {
    backgroundColor: '#f8fafc',
  },
  menuItemDisabled: {
    opacity: 0.45,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  menuItemTextDisabled: {
    color: AppColors.text.quaternary,
  },
  menuItemTextDanger: {
    color: AppColors.status.error,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
});
