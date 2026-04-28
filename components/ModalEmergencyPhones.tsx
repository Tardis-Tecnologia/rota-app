import { EMERGENCY_CONTACTS } from '@/components/EmergencyPhones';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModalEmergencyPhonesProps = {
  visible: boolean;
  onClose: () => void;
};

export function ModalEmergencyPhones({ visible, onClose }: ModalEmergencyPhonesProps) {
  const insets = useSafeAreaInsets();

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTouchableArea} onPress={onClose} />

        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View style={styles.sheetIcon}>
                <Ionicons name="call" size={22} color={AppColors.text.white} />
              </View>
              <View style={styles.sheetTitleCol}>
                <Text style={styles.sheetTitle}>Emergência</Text>
                <Text style={styles.sheetSubtitle}>Toque no número para ligar</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={22} color={AppColors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.list}>
            {EMERGENCY_CONTACTS.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.row,
                  index < EMERGENCY_CONTACTS.length - 1 && styles.rowBorder,
                ]}
                onPress={() => handleCall(item.number)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Ligar para ${item.label}: ${item.number}`}
              >
                <View style={[styles.dot, { backgroundColor: item.dotColor }]} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDescription}>{item.description}</Text>
                </View>
                <Text style={styles.rowNumber}>{item.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchableArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: AppColors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 14,
    paddingHorizontal: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitleCol: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  sheetSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.muted,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    marginBottom: 6,
  },
  list: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.18)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  rowDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  rowNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    marginLeft: 12,
  },
});

