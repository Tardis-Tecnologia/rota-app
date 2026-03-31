import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getPasswordPolicyError, PASSWORD_PLACEHOLDER } from '@/utils/passwordPolicy';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type FieldKey = 'name' | 'email' | 'password' | 'confirmPassword';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearFieldError = (key: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRegister = async () => {
    setServerError('');
    const next: Partial<Record<FieldKey, string>> = {};

    if (!name.trim()) {
      next.name = 'O nome é obrigatório.';
    }
    if (!email.trim()) {
      next.email = 'O e-mail é obrigatório.';
    } else if (!email.trim().includes('@')) {
      next.email = 'O e-mail deve conter @.';
    }
    const passwordErr = getPasswordPolicyError(password);
    if (passwordErr) {
      next.password = passwordErr;
    }
    if (!confirmPassword.trim()) {
      next.confirmPassword = 'Confirme sua senha.';
    } else if (password && password !== confirmPassword) {
      next.confirmPassword = 'As senhas não coincidem.';
    }

    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      Alert.alert(
        'Cadastro concluído',
        'Sua conta foi criada com sucesso. Faça login com seu e-mail e senha.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ],
      );
    } catch (e) {
      const message =
        e instanceof Error && e.message === 'EMAIL_JA_CADASTRADO'
          ? 'Este e-mail já está em uso. Tente outro.'
          : e instanceof Error
            ? e.message
            : 'Não foi possível criar a conta. Tente novamente.';
      setServerError(message);
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
                <Ionicons name="person-add" size={44} color={AppColors.primary} />
              </View>
              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.subtitle}>
                Preencha os dados para se cadastrar no app.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={[styles.input, fieldErrors.name && styles.inputError]}
                placeholder="Seu nome completo"
                placeholderTextColor={AppColors.gray[500]}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  clearFieldError('name');
                  setServerError('');
                }}
                autoCapitalize="words"
                editable={!loading}
              />
              {fieldErrors.name ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text>
              ) : null}

              <Text style={[styles.label, styles.labelMargin]}>E-mail</Text>
              <TextInput
                style={[styles.input, fieldErrors.email && styles.inputError]}
                placeholder="ex: seu@gmail.com"
                placeholderTextColor={AppColors.gray[500]}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearFieldError('email');
                  setServerError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
              {fieldErrors.email ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
              ) : null}

              <Text style={[styles.label, styles.labelMargin]}>Senha</Text>
              <TextInput
                style={[styles.input, fieldErrors.password && styles.inputError]}
                placeholder={PASSWORD_PLACEHOLDER}
                placeholderTextColor={AppColors.gray[500]}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  clearFieldError('password');
                  setServerError('');
                }}
                secureTextEntry
                editable={!loading}
              />
              {fieldErrors.password ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
              ) : null}

              <Text style={[styles.label, styles.labelMargin]}>Confirmar senha</Text>
              <TextInput
                style={[
                  styles.input,
                  fieldErrors.confirmPassword && styles.inputError,
                ]}
                placeholder="Repita a senha"
                placeholderTextColor={AppColors.gray[500]}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  clearFieldError('confirmPassword');
                  setServerError('');
                }}
                secureTextEntry
                editable={!loading}
              />
              {fieldErrors.confirmPassword ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
              ) : null}

              {serverError ? (
                <View style={styles.errorWrap}>
                  <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
                  <Text style={styles.errorText}>{serverError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Criar conta</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Já tem uma conta? </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={loading}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text style={styles.linkBold}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  inputError: {
    borderColor: AppColors.status.error,
    backgroundColor: 'rgba(231, 76, 60, 0.06)',
  },
  fieldErrorText: {
    fontSize: 13,
    color: AppColors.status.error,
    marginTop: 6,
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
