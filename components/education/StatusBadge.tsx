import { AppColors } from '@/constants/theme';
import { REQUEST_STATUS_LABEL } from '@/services/educationServicesApi';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  RECEIVED: { bg: '#e0f2fe', fg: '#0369a1' },
  IN_REVIEW: { bg: '#fef3c7', fg: '#b45309' },
  WAITLIST: { bg: '#ede9fe', fg: '#6d28d9' },
  PENDING: { bg: '#ffedd5', fg: '#c2410c' },
  APPROVED: { bg: '#d1fae5', fg: '#047857' },
  REJECTED: { bg: '#fee2e2', fg: '#b91c1c' },
  READY: { bg: '#d1fae5', fg: '#047857' },
  REQUESTED: { bg: '#e0f2fe', fg: '#0369a1' },
};

type StatusBadgeProps = {
  status: string;
  label?: string;
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? { bg: AppColors.background.input, fg: AppColors.text.tertiary };
  const text = label ?? REQUEST_STATUS_LABEL[status] ?? status;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
