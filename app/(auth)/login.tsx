import ModalSolicitarLojaParceira from '@/components/ModalSolicitarLojaParceira';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const VISITANTE_LOGIN_EMAIL = 'visitante@rota.com';
const VISITANTE_LOGIN_PASSWORD = 'Cliente123';

const COMERCIO_GRADIENT_COLORS = ['#0097B2', '#2E67E1'] as const;

export default function LoginScreen() {
  const { login, loginWithSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [parceiroModalVisible, setParceiroModalVisible] = useState(false);

  const { loginWithGoogle, isGoogleAuthAvailable } = useGoogleAuth(
    async ({ user: u, token }) => {
      setGoogleLoading(true);
      try {
        await loginWithSession({ token, user: u ?? {} });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Não foi possível entrar com o Google.';
        setError(message);
      } finally {
        setGoogleLoading(false);
      }
    },
    (message) => {
      setGoogleLoading(false);
      setError(message);
    },
  );

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) {
      setError('Digite seu e-mail.');
      return;
    }
    if (!email.includes('@')) {
      setError('O e-mail deve conter @.');
      return;
    }
    if (!password) {
      setError('Digite sua senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message === 'EMAIL_OU_SENHA_INCORRETOS'
            ? 'E-mail ou senha incorretos.'
            : e.message
          : 'Não foi possível entrar. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitanteLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(VISITANTE_LOGIN_EMAIL, VISITANTE_LOGIN_PASSWORD);
    } catch (e) {
      const message =
        e instanceof Error && e.message === 'EMAIL_OU_SENHA_INCORRETOS'
          ? 'Visitante: confira o seed do banco (visitante@rota.com / Cliente123).'
          : e instanceof Error
            ? e.message
            : 'Não foi possível entrar como visitante.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="shield-checkmark" size={44} color={AppColors.primary} />
              </View>
              <Text style={styles.title}>Entrar</Text>
              <Text style={styles.subtitle}>
                Use seu e-mail e senha para acessar o app.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: cliente@gmail.com"
                placeholderTextColor={AppColors.gray[500]}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />

              <Text style={[styles.label, styles.labelMargin]}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor={AppColors.gray[500]}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.linkWrap}
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.link}>Esqueci minha senha</Text>
              </TouchableOpacity>

              {error ? (
                <View style={styles.errorWrap}>
                  <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Entrar</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.visitanteButton, loading && styles.buttonDisabled]}
                onPress={handleVisitanteLogin}
                activeOpacity={0.85}
                disabled={loading || googleLoading}
              >
                <Ionicons name="person-outline" size={20} color={AppColors.text.secondary} />
                <Text style={styles.visitanteButtonText}>Entrar como visitante</Text>
              </TouchableOpacity>

              <View style={styles.comercioSection}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setParceiroModalVisible(true)}
                  disabled={loading || googleLoading}
                >
                  <LinearGradient
                    colors={[...COMERCIO_GRADIENT_COLORS]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.comercioGradient}
                  >
                    <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.comercioButtonText}>Quero ser comércio parceiro</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[
                  styles.googleButton,
                  (loading || googleLoading || !isGoogleAuthAvailable) && styles.buttonDisabled,
                ]}
                onPress={() => {
                  setGoogleLoading(true);
                  setError('');
                  void loginWithGoogle();
                }}
                activeOpacity={0.85}
                disabled={loading || googleLoading || !isGoogleAuthAvailable}
              >
                {googleLoading ? (
                  <ActivityIndicator color={AppColors.text.secondary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={AppColors.text.secondary} />
                    <Text style={styles.googleButtonText}>Entrar com Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Não tem uma conta? </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={loading}
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text style={styles.linkBold}>Cadastre-se</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ModalSolicitarLojaParceira
        visible={parceiroModalVisible}
        onClose={() => setParceiroModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const CARD_MAX_WIDTH = 400;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.muted,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: AppColors.background.default,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.08)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.palette.sky.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 204, 0.15)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 8,
  },
  labelMargin: {
    marginTop: 18,
  },
  input: {
    backgroundColor: AppColors.background.muted,
    borderWidth: 1.5,
    borderColor: AppColors.border.muted,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.text.secondary,
  },
  linkWrap: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  link: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500',
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  errorText: {
    fontSize: 14,
    color: AppColors.status.error,
    flex: 1,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 26,
    gap: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  visitanteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.default,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: AppColors.border.muted,
  },
  visitanteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
    letterSpacing: 0.2,
  },
  comercioSection: {
    marginTop: 20,
  },
  comercioGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#0097B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  comercioButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  comercioDemoHint: {
    marginTop: 10,
    fontSize: 12,
    color: AppColors.gray[500],
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.border.muted,
  },
  dividerText: {
    fontSize: 13,
    color: AppColors.gray[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.default,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: AppColors.border.muted,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 15,
    color: AppColors.gray[500],
  },
  linkBold: {
    fontSize: 15,
    color: AppColors.primary,
    fontWeight: '600',
  },
});
