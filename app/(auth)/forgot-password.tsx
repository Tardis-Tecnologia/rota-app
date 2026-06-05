import { AppColors } from '@/constants/theme';
import { forgotPassword, resetPasswordWithCode, verifyResetCode } from '@/services/authApi';
import { getPasswordPolicyError, PASSWORD_PLACEHOLDER } from '@/utils/passwordPolicy';
import { Ionicons } from '@expo/vector-icons';
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

type Phase = 'email' | 'code' | 'password' | 'done';

export default function ForgotPasswordScreen() {
  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentHint, setSentHint] = useState('');

  const handleSendCode = async () => {
    setError('');
    setSentHint('');
    if (!email.trim()) {
      setError('Digite seu e-mail.');
      return;
    }
    if (!email.includes('@')) {
      setError('O e-mail deve conter @.');
      return;
    }
    setLoading(true);
    try {
      const { message } = await forgotPassword(email);
      setSentHint(message);
      setPhase('code');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível enviar o código. Verifique a conexão e tente de novo.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    if (!code.trim()) {
      setError('Digite o código de 6 dígitos enviado por e-mail.');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('O código deve ter exatamente 6 números.');
      return;
    }
    setLoading(true);
    try {
      await verifyResetCode(email, code);
      setPhase('password');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Código inválido ou expirado. Verifique e tente de novo.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    const pwdErr = getPasswordPolicyError(newPassword);
    if (pwdErr) {
      setError(pwdErr.replace(/^A senha/, 'A nova senha'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithCode(email, code, newPassword);
      setPhase('done');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível redefinir a senha. Tente novamente.',
      );
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="key" size={44} color={AppColors.primary} />
              </View>
              <Text style={styles.title}>
                {phase === 'done'
                  ? 'Senha alterada'
                  : phase === 'password'
                    ? 'Nova senha'
                    : phase === 'code'
                      ? 'Confirmar código'
                      : 'Esqueci minha senha'}
              </Text>
              <Text style={styles.subtitle}>
                {phase === 'email' &&
                  'Informe o e-mail da sua conta (cidadão ou loja parceira). Enviaremos um código para redefinir a senha.'}
                {phase === 'code' &&
                  `Digite o código de 6 dígitos que enviamos para ${email.trim().toLowerCase()}.`}
                {phase === 'password' &&
                  'Código confirmado. Defina uma nova senha para sua conta.'}
                {phase === 'done' && 'Sua senha foi atualizada. Você já pode entrar com a nova senha no app.'}
              </Text>
            </View>

            {phase === 'done' ? (
              <View style={styles.successBlock}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark-circle" size={36} color={AppColors.status.success} />
                </View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.replace('/(auth)/login')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonText}>Voltar ao login</Text>
                </TouchableOpacity>
              </View>
            ) : phase === 'code' ? (
              <View style={styles.form}>
                {sentHint ? (
                  <View style={styles.hintWrap}>
                    <Ionicons name="mail-outline" size={18} color={AppColors.primary} />
                    <Text style={styles.hintText}>{sentHint}</Text>
                  </View>
                ) : null}

                <Text style={styles.label}>Código</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={AppColors.gray[500]}
                  value={code}
                  onChangeText={(t) => {
                    setCode(t.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />

                {error ? (
                  <View style={styles.errorWrap}>
                    <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Continuar</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setPhase('email');
                    setCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSentHint('');
                  }}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Usar outro e-mail</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleSendCode}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.linkButtonText}>Reenviar código</Text>
                </TouchableOpacity>
              </View>
            ) : phase === 'password' ? (
              <View style={styles.form}>
                <View style={styles.successHintWrap}>
                  <Ionicons name="shield-checkmark" size={18} color={AppColors.status.success} />
                  <Text style={styles.successHintText}>Código verificado com sucesso.</Text>
                </View>

                <Text style={styles.label}>Nova senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder={PASSWORD_PLACEHOLDER}
                  placeholderTextColor={AppColors.gray[500]}
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    setError('');
                  }}
                  secureTextEntry
                  editable={!loading}
                />

                <Text style={[styles.label, styles.labelMargin]}>Confirmar nova senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={AppColors.gray[500]}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setError('');
                  }}
                  secureTextEntry
                  editable={!loading}
                />

                {error ? (
                  <View style={styles.errorWrap}>
                    <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Redefinir senha</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setPhase('code');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Voltar ao código</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ex: seu@gmail.com"
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

                {error ? (
                  <View style={styles.errorWrap}>
                    <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Enviar código</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    padding: 8,
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
  hintWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.12)',
  },
  hintText: {
    fontSize: 14,
    color: AppColors.text.secondary,
    flex: 1,
    lineHeight: 20,
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
    paddingHorizontal: 24,
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
  secondaryButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: AppColors.gray[500],
    fontWeight: '500',
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkButtonText: {
    fontSize: 15,
    color: AppColors.primary,
    fontWeight: '600',
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(39, 174, 96, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successHintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.22)',
  },
  successHintText: {
    fontSize: 14,
    color: AppColors.text.secondary,
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
});
