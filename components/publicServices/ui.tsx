import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

export const ps = {
  border: '#E2E8F0',
  muted: '#64748B',
  title: '#0F172A',
  body: '#334155',
  surface: '#FFFFFF',
  page: '#F8FAFC',
  primary: AppColors.primary,
  danger: '#DC2626',
};

export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back-outline" size={22} color={AppColors.text.secondary} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerBack} />
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const badgeColors: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: '#F1F5F9', fg: '#475569' },
  info: { bg: '#DBEAFE', fg: '#1D4ED8' },
  success: { bg: '#DCFCE7', fg: '#15803D' },
  warning: { bg: '#FEF3C7', fg: '#B45309' },
  danger: { bg: '#FEE2E2', fg: '#B91C1C' },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const c = badgeColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const isDisabled = disabled || loading;
  const fg = variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? ps.danger : ps.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'outline' && styles.buttonOutline,
        variant === 'danger' && styles.buttonDanger,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  error,
  ...input
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        {...input}
        style={[styles.input, input.multiline && styles.inputMultiline, error && styles.inputError]}
      />
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function StateView({
  loading,
  error,
  empty,
  emptyIcon = 'file-tray-outline',
  emptyTitle,
  emptyMessage,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={ps.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.state}>
        <Ionicons name="cloud-offline-outline" size={36} color="#94A3B8" />
        <Text style={styles.stateTitle}>Não foi possível carregar</Text>
        <Text style={styles.stateMessage}>{error}</Text>
        {onRetry ? (
          <View style={styles.stateAction}>
            <PrimaryButton label="Tentar novamente" variant="outline" onPress={onRetry} />
          </View>
        ) : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.state}>
        <Ionicons name={emptyIcon} size={36} color="#94A3B8" />
        {emptyTitle ? <Text style={styles.stateTitle}>{emptyTitle}</Text> : null}
        {emptyMessage ? <Text style={styles.stateMessage}>{emptyMessage}</Text> : null}
      </View>
    );
  }
  return null;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={ps.muted} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ps.border,
    backgroundColor: ps.surface,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  pressed: { opacity: 0.7 },
  card: {
    backgroundColor: ps.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ps.border,
    padding: 14,
  },
  cardPressed: { backgroundColor: '#F1F5F9' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimary: { backgroundColor: ps.primary },
  buttonOutline: { borderWidth: 1.5, borderColor: ps.primary, backgroundColor: ps.surface },
  buttonDanger: { borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: ps.body },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: ps.title,
    backgroundColor: ps.surface,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: ps.danger },
  fieldHint: { fontSize: 12, color: ps.muted },
  fieldError: { fontSize: 12, color: ps.danger, fontWeight: '600' },
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ps.surface,
  },
  chipSelected: { backgroundColor: ps.primary, borderColor: ps.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: ps.body },
  chipTextSelected: { color: '#FFFFFF' },
  state: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  stateTitle: { fontSize: 16, fontWeight: '700', color: ps.title, textAlign: 'center' },
  stateMessage: { fontSize: 14, color: ps.muted, textAlign: 'center', lineHeight: 20 },
  stateAction: { marginTop: 8, alignSelf: 'stretch' },
  sectionTitleWrap: { gap: 4, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: ps.title },
  sectionSubtitle: { fontSize: 14, color: ps.muted, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  infoText: { flex: 1, fontSize: 13, color: ps.body, lineHeight: 18 },
});
