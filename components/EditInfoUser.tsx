import Toast from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';
import { getPasswordPolicyError, PASSWORD_PLACEHOLDER } from '@/utils/passwordPolicy';
import { formatCpf, isCpfWith11Digits, onlyCpfDigits } from '@/utils/cpf';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

type FieldKey =
  | 'name'
  | 'email'
  | 'uf'
  | 'govbrSub'
  | 'cpf'
  | 'password'
  | 'confirmPassword';

export default function EditInfoUser() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uf, setUf] = useState('');
  const [govbrSub, setGovbrSub] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  const showSuccessToast = useCallback(() => {
    setShowToast(false);
    setToastKey((k) => k + 1);
    setTimeout(() => setShowToast(true), 50);
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setUf(user.uf ?? '');
    setGovbrSub(user.govbrSub ?? '');
    setCpf(formatCpf(user.cpf ?? ''));
  }, [user]);

  const clearFieldError = (key: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    setServerError('');
    const next: Partial<Record<FieldKey, string>> = {};

    if (!name.trim()) {
      next.name = 'O nome é obrigatório.';
    }
    if (!email.trim()) {
      next.email = 'O e-mail é obrigatório.';
    } else if (!email.trim().includes('@')) {
      next.email = 'Informe um e-mail válido.';
    }
    if (!cpf.trim()) {
      next.cpf = 'O CPF é obrigatório.';
    } else if (!isCpfWith11Digits(cpf)) {
      next.cpf = 'Informe um CPF com 11 dígitos.';
    }
    const ufTrim = uf.trim().toUpperCase();
    if (ufTrim && ufTrim.length !== 2) {
      next.uf = 'Use a sigla do estado com 2 letras (ex.: SP).';
    }
    if (password || confirmPassword) {
      const passwordErr = getPasswordPolicyError(password);
      if (passwordErr) {
        next.password = passwordErr;
      }
      if (!confirmPassword) {
        next.confirmPassword = 'Confirme a nova senha.';
      } else if (password !== confirmPassword) {
        next.confirmPassword = 'As senhas não coincidem.';
      }
    }

    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        uf: ufTrim ? ufTrim : null,
        govbrSub: govbrSub.trim() || null,
        cpf: onlyCpfDigits(cpf),
        password: password || undefined,
      });
      setPassword('');
      setConfirmPassword('');
      showSuccessToast();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
          <Text style={[styles.label, styles.labelMargin]}>CPF</Text>
          <TextInput
            style={[styles.input, fieldErrors.cpf && styles.inputError]}
            placeholder="ex: 000.000.000-00"
            placeholderTextColor={AppColors.gray[500]}
            value={cpf}
            onChangeText={(t) => {
              setCpf(formatCpf(t));
              clearFieldError('cpf');
              setServerError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            maxLength={14}
            editable={!loading}
          />
          {fieldErrors.cpf ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.cpf}</Text>
          ) : null}

          {/* <Text style={[styles.label, styles.labelMargin]}>UF</Text>
          <TextInput
            style={[styles.input, fieldErrors.uf && styles.inputError]}
            placeholder="Ex.: SP (opcional)"
            placeholderTextColor={AppColors.gray[500]}
            value={uf}
            onChangeText={(t) => {
              setUf(t.toUpperCase());
              clearFieldError('uf');
              setServerError('');
            }}
            autoCapitalize="characters"
            maxLength={2}
            editable={!loading}
          />
          {fieldErrors.uf ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.uf}</Text>
          ) : null}

          <Text style={[styles.label, styles.labelMargin]}>Gov.br (opcional)</Text>
          <TextInput
            style={[styles.input, fieldErrors.govbrSub && styles.inputError]}
            placeholder="Identificador Gov.br, se houver"
            placeholderTextColor={AppColors.gray[500]}
            value={govbrSub}
            onChangeText={(t) => {
              setGovbrSub(t);
              clearFieldError('govbrSub');
              setServerError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {fieldErrors.govbrSub ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.govbrSub}</Text>
          ) : null}

          {serverError ? (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          ) : null} */}

          <Text style={[styles.label, styles.labelMargin]}>Alterar Senha</Text>
          <View style={styles.passwordInputWrap}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithToggle,
                fieldErrors.password && styles.inputError,
              ]}
              placeholder={PASSWORD_PLACEHOLDER}
              placeholderTextColor={AppColors.gray[500]}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                clearFieldError('password');
                setServerError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.passwordToggleButton}
              onPress={() => setShowPassword((v) => !v)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={AppColors.gray[500]}
              />
            </TouchableOpacity>
          </View>
          {fieldErrors.password ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
          ) : null}

          <Text style={[styles.label, styles.labelMargin]}>Confirmar nova senha</Text>
          <View style={styles.passwordInputWrap}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithToggle,
                fieldErrors.confirmPassword && styles.inputError,
              ]}
              placeholder="Repita a nova senha"
              placeholderTextColor={AppColors.gray[500]}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                clearFieldError('confirmPassword');
                setServerError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.passwordToggleButton}
              onPress={() => setShowConfirmPassword((v) => !v)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={AppColors.gray[500]}
              />
            </TouchableOpacity>
          </View>
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
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={AppColors.text.white} />
            ) : (
              <Text style={styles.saveButtonText}>Salvar alterações</Text>
            )}
          </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast
        key={toastKey}
        message="Perfil atualizado com sucesso!"
        visible={showToast}
        type="success"
        duration={2800}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 8,
  },
  labelMargin: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.text.secondary,
    backgroundColor: AppColors.background.default,
  },
  passwordInputWrap: {
    position: 'relative',
  },
  inputWithToggle: {
    paddingRight: 46,
  },
  passwordToggleButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: AppColors.status.error,
  },
  fieldErrorText: {
    marginTop: 6,
    fontSize: 13,
    color: AppColors.status.error,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.background.backgroundDanger,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.status.error,
  },
  saveButton: {
    marginTop: 28,
    backgroundColor: AppColors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.white,
  },
});
