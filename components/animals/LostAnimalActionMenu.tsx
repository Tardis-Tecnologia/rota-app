import type { LostAnimalDto } from '@/components/animals/lostAnimalUtils';
import { isLostAnimalMarkedFound } from '@/components/animals/lostAnimalUtils';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface LostAnimalActionMenuProps {
  item: LostAnimalDto | null;
  onClose: () => void;
  onMarkFound: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
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
        color={danger ? AppColors.status.error : accent ? '#059669' : AppColors.text.secondary}
      />
      <Text
        style={[
          styles.menuRowText,
          danger && styles.menuRowTextDanger,
          accent && styles.menuRowTextAccent,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function LostAnimalActionMenu({
  item,
  onClose,
  onMarkFound,
  onEdit,
  onDelete,
}: LostAnimalActionMenuProps) {
  if (!item) return null;
  const alreadyFound = isLostAnimalMarkedFound(item);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle} numberOfLines={2}>
            {item.animalName?.trim() || 'Publicação'}
          </Text>
          <Text style={styles.sheetSubtitle}>Gerenciar sua publicação</Text>

          {!alreadyFound ? (
            <MenuRow
              icon="checkmark-circle-outline"
              label="Marcar como encontrado"
              onPress={onMarkFound}
              accent
            />
          ) : null}

          <MenuRow icon="create-outline" label="Editar publicação" onPress={onEdit} />
          <MenuRow icon="trash-outline" label="Apagar publicação" onPress={onDelete} danger />

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
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
  menuRowTextAccent: { color: '#059669' },
  menuRowTextDanger: { color: AppColors.status.error },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: AppColors.text.tertiary },
});
