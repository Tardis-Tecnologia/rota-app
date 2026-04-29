import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type PopoutType = 'success' | 'error' | 'info' | 'warning';

export type PopoutProps = {
  visible: boolean;
  type?: PopoutType;
  title: string;
  message?: string | null;
  primaryLabel?: string;
  onClose: () => void;
};

function typeMeta(type: PopoutType): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  titleColor: string;
  messageColor: string;
  primaryBg: string;
  primaryText: string;
} {
  switch (type) {
    case 'success':
      return {
        icon: 'checkmark',
        iconBg: 'rgba(39, 174, 96, 0.14)',
        iconColor: AppColors.status.success,
        titleColor: AppColors.text.secondary,
        messageColor: AppColors.text.tertiary,
        primaryBg: AppColors.status.success,
        primaryText: AppColors.text.white,
      };
    case 'warning':
      return {
        icon: 'warning',
        iconBg: 'rgba(243, 156, 18, 0.14)',
        iconColor: AppColors.status.warning,
        titleColor: AppColors.text.secondary,
        messageColor: AppColors.text.tertiary,
        primaryBg: AppColors.status.warning,
        primaryText: AppColors.text.white,
      };
    case 'error':
      return {
        icon: 'close',
        iconBg: 'rgba(231, 76, 60, 0.14)',
        iconColor: AppColors.status.error,
        titleColor: AppColors.text.secondary,
        messageColor: AppColors.text.tertiary,
        primaryBg: AppColors.status.error,
        primaryText: AppColors.text.white,
      };
    case 'info':
    default:
      return {
        icon: 'information',
        iconBg: 'rgba(0, 102, 204, 0.12)',
        iconColor: AppColors.primary,
        titleColor: AppColors.text.secondary,
        messageColor: AppColors.text.tertiary,
        primaryBg: AppColors.primary,
        primaryText: AppColors.text.white,
      };
  }
}

export function Popout({
  visible,
  type = 'info',
  title,
  message,
  primaryLabel = 'OK',
  onClose,
}: PopoutProps) {
  const meta = useMemo(() => typeMeta(type), [type]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={AppColors.text.tertiary} />
          </TouchableOpacity>

          <View style={[styles.iconWrap, { backgroundColor: meta.iconBg }]}>
            <Ionicons name={meta.icon} size={26} color={meta.iconColor} />
          </View>

          <Text style={[styles.title, { color: meta.titleColor }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: meta.messageColor }]}>{message}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onClose}
            style={[styles.primaryButton, { backgroundColor: meta.primaryBg }]}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
          >
            <Text style={[styles.primaryButtonText, { color: meta.primaryText }]}>
              {primaryLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    backgroundColor: AppColors.background.glass,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});

