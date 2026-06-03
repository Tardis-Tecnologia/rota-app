import { AppColors } from '@/constants/theme';
import { formatPostingSuspensionUntil } from '@/utils/forumPostingSuspensionParse';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ForumRestrictionModalProps = {
  visible: boolean;
  title: string;
  message: string;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  variant?: 'suspend' | 'ban' | 'generic';
  onClose: () => void;
};

export default function ForumRestrictionModal({
  visible,
  title,
  message,
  suspendedUntil,
  suspensionReason,
  variant = 'generic',
  onClose,
}: ForumRestrictionModalProps) {
  const untilLabel = useMemo(() => {
    const iso = suspendedUntil?.trim();
    if (!iso) return null;
    return formatPostingSuspensionUntil(iso);
  }, [suspendedUntil]);

  const icon =
    variant === 'ban'
      ? { name: 'ban-outline' as const, color: AppColors.status.error }
      : { name: 'pause-circle-outline' as const, color: '#b45309' };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconWrap,
              variant === 'ban' && styles.iconWrapBan,
            ]}
          >
            <Ionicons name={icon.name} size={36} color={icon.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          {untilLabel ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Suspensão até</Text>
              <Text style={styles.infoText}>{untilLabel}</Text>
            </View>
          ) : null}
          {suspensionReason?.trim() ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Motivo</Text>
              <Text style={styles.infoText}>{suspensionReason.trim()}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>Entendi</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 22,
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapBan: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoBox: {
    alignSelf: 'stretch',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#78350f',
    fontWeight: '600',
  },
  btn: {
    alignSelf: 'stretch',
    marginTop: 4,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.9 },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
