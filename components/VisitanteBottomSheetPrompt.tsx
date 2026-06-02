import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type VisitanteBottomSheetPromptProps = {
  /** Título principal (ex.: nome do serviço). */
  headline?: string;
  /** Texto de apoio; se omitido, usa featureLabel. */
  message?: string;
  /** Usado na mensagem padrão: "Para {featureLabel}, faça login…" */
  featureLabel?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function VisitanteBottomSheetPrompt({
  headline = 'Conta necessária',
  message,
  featureLabel = 'usar este recurso',
  onDismiss,
  dismissLabel = 'Agora não',
}: VisitanteBottomSheetPromptProps) {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const body =
    message ??
    `Para ${featureLabel}, entre com uma conta de cidadão cadastrada. No modo visitante você pode explorar o app, mas não registrar solicitações.`;

  const onLoginPress = useCallback(async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }, [logout]);

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <LinearGradient
          colors={['#ecfeff', '#ccfbf1', '#f8fafc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.iconOuter}>
            <LinearGradient
              colors={['#0891b2', '#0d9488']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.iconInner}
            >
              <Ionicons name="person-circle-outline" size={36} color="#fff" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.bulletRow}>
        <View style={styles.bullet}>
          <Ionicons name="eye-outline" size={16} color="#0e7490" />
          <Text style={styles.bulletText}>Explorar serviços e conteúdos</Text>
        </View>
        <View style={styles.bullet}>
          <Ionicons name="lock-closed-outline" size={16} color="#0e7490" />
          <Text style={styles.bulletText}>Enviar pedidos após o login</Text>
        </View>
      </View>

      <Pressable
        onPress={() => void onLoginPress()}
        disabled={busy}
        style={({ pressed }) => [pressed && !busy && styles.primaryPressed]}
        accessibilityRole="button"
        accessibilityLabel="Fazer login com conta cadastrada"
      >
        <LinearGradient
          colors={['#0891b2', '#0d9488']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryBtn}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Fazer login</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissPressed]}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
        >
          <Text style={styles.dismissText}>{dismissLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
  },
  hero: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroGradient: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOuter: {
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  bulletRow: {
    gap: 10,
    marginBottom: 22,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f766e',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  primaryPressed: {
    opacity: 0.92,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  dismissBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissPressed: {
    opacity: 0.7,
  },
  dismissText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.tertiary,
  },
});
