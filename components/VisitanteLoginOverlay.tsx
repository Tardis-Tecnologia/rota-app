import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DEFAULT_MESSAGE =
  'Nesta visualização de visitante esta área não está disponível. Faça login com uma conta cadastrada para usar todos os recursos.';

type VisitanteLoginOverlayProps = {
  visible?: boolean;
  message?: string;
};

export function VisitanteLoginOverlay({ visible = true, message }: VisitanteLoginOverlayProps) {
  const { user, logout } = useAuth();
  const [busy, setBusy] = React.useState(false);

  const onLoginPress = useCallback(async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }, [logout]);

  if (!visible || user?.profile !== 'VISITANTE') {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none" accessibilityViewIsModal>
      <View style={styles.backdrop} pointerEvents="auto" accessibilityLabel="Área bloqueada para visitante" />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.card}>
          <Text style={styles.title}>Acesso restrito</Text>
          <Text style={styles.body}>{message ?? DEFAULT_MESSAGE}</Text>
          <TouchableOpacity
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={() => void onLoginPress()}
            activeOpacity={0.85}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Fazer login com outra conta"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Fazer login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    backgroundColor: AppColors.background.overlayStrong,
  },
  center: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    alignSelf: 'center',
    minWidth: 200,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
