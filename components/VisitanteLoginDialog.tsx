import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DEFAULT_TITLE = 'Acesso restrito';

function defaultMessage(feature: string): string {
  return `Para ${feature}, faça login com uma conta cadastrada.`;
}

export type VisitanteLoginDialogProps = {
  visible: boolean;
  feature: string;
  title?: string;
  message?: string;
  onDismiss: () => void;
};

export function VisitanteLoginDialog({
  visible,
  feature,
  title = DEFAULT_TITLE,
  message,
  onDismiss,
}: VisitanteLoginDialogProps) {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const body = message ?? defaultMessage(feature);

  const onLoginPress = useCallback(async () => {
    setBusy(true);
    try {
      onDismiss();
      await logout();
    } finally {
      setBusy(false);
    }
  }, [logout, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityRole="button">
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#0891b2', '#0d9488']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.iconGradient}
            >
              <Ionicons name="lock-closed" size={26} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onDismiss}
              disabled={busy}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelPressed]}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable
              onPress={() => void onLoginPress()}
              disabled={busy}
              style={({ pressed }) => [styles.loginWrap, pressed && !busy && styles.loginPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fazer login"
            >
              <LinearGradient
                colors={['#0891b2', '#0d9488']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.loginBtn}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={18} color="#fff" />
                    <Text style={styles.loginText}>Fazer login</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    marginBottom: 16,
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    opacity: 0.85,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.tertiary,
  },
  loginWrap: {
    flex: 1.2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginPressed: {
    opacity: 0.92,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
