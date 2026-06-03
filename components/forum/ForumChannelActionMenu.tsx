import { AppColors } from '@/constants/theme';
import type { ForumCommunityListItem } from '@/services/forumCommunityApi';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface ForumChannelActionMenuProps {
  channel: ForumCommunityListItem | null;
  isSelected: boolean;
  canFollow: boolean;
  canReport?: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onFollow?: () => void;
  onReport?: () => void;
  onSelect: () => void;
  onDeselect: () => void;
}

function MenuRow({
  icon,
  label,
  onPress,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={accent ? '#0891b2' : AppColors.text.secondary}
      />
      <Text style={[styles.menuRowText, accent && styles.menuRowTextAccent]}>{label}</Text>
    </Pressable>
  );
}

export default function ForumChannelActionMenu({
  channel,
  isSelected,
  canFollow,
  canReport = false,
  onClose,
  onViewDetails,
  onFollow,
  onReport,
  onSelect,
  onDeselect,
}: ForumChannelActionMenuProps) {
  if (!channel) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle} numberOfLines={2}>
            {channel.name}
          </Text>
          <Text style={styles.sheetSubtitle}>O que deseja fazer?</Text>

          <MenuRow icon="information-circle-outline" label="Ver detalhes" onPress={onViewDetails} />

          {canFollow && onFollow ? (
            <MenuRow
              icon="add-circle-outline"
              label="Seguir canal"
              onPress={onFollow}
              accent
            />
          ) : null}

          {canReport && onReport ? (
            <MenuRow
              icon="flag-outline"
              label="Denunciar canal"
              onPress={onReport}
            />
          ) : null}

          {isSelected ? (
            <MenuRow
              icon="layers-outline"
              label="Ver feed de todos os canais"
              onPress={onDeselect}
            />
          ) : (
            <MenuRow
              icon="radio-button-on-outline"
              label="Selecionar para explorar"
              onPress={onSelect}
              accent
            />
          )}

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuRowPressed: { backgroundColor: AppColors.background.muted },
  menuRowText: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  menuRowTextAccent: { color: '#0891b2' },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: AppColors.text.tertiary },
});
