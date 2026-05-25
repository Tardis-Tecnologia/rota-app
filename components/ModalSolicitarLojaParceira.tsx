import { AppColors } from '@/constants/theme';
import { formatBrazilPhoneInput } from '@/utils/phoneMask';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type FormState = {
  nomeLoja: string;
  cnpj: string;
  segmento: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  email: string;
  sobre: string;
};

const EMPTY_FORM: FormState = {
  nomeLoja: '',
  cnpj: '',
  segmento: '',
  endereco: '',
  responsavel: '',
  telefone: '',
  email: '',
  sobre: '',
};

type ModalSolicitarLojaParceiraProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalSolicitarLojaParceira({
  visible,
  onClose,
}: ModalSolicitarLojaParceiraProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setIsSubmitted(false);
    setFormError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!form.nomeLoja.trim()) {
      setFormError('Informe o nome da loja.');
      return;
    }
    if (!form.responsavel.trim()) {
      setFormError('Informe o nome do responsável.');
      return;
    }
    if (!form.telefone.trim()) {
      setFormError('Informe o telefone.');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setFormError('Informe um e-mail válido.');
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.panel}>
          {!isSubmitted ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.headerTitle}>Solicitar entrada como loja parceira</Text>
                  <Text style={styles.headerSubtitle}>
                    Preencha seus dados. Seu pedido vai para análise da equipe.
                  </Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                >
                  <Ionicons name="close" size={22} color={AppColors.text.tertiary} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nome da loja *</Text>
                  <TextInput
                    value={form.nomeLoja}
                    onChangeText={(v) => updateField('nomeLoja', v)}
                    placeholder="Nome fantasia"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={styles.input}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.formGroup, styles.rowItem]}>
                    <Text style={styles.label}>CNPJ</Text>
                    <TextInput
                      value={form.cnpj}
                      onChangeText={(v) => updateField('cnpj', v)}
                      placeholder="00.000.000/0000-00"
                      placeholderTextColor={AppColors.text.quaternary}
                      style={styles.input}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, styles.rowItem]}>
                    <Text style={styles.label}>Segmento (ex: pet shop)</Text>
                    <TextInput
                      value={form.segmento}
                      onChangeText={(v) => updateField('segmento', v)}
                      placeholder="Segmento"
                      placeholderTextColor={AppColors.text.quaternary}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Endereço da loja</Text>
                  <TextInput
                    value={form.endereco}
                    onChangeText={(v) => updateField('endereco', v)}
                    placeholder="Rua, número, bairro"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={styles.input}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nome do responsável *</Text>
                  <TextInput
                    value={form.responsavel}
                    onChangeText={(v) => updateField('responsavel', v)}
                    placeholder="Nome completo"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={styles.input}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.formGroup, styles.rowItem]}>
                    <Text style={styles.label}>Telefone *</Text>
                    <TextInput
                      value={form.telefone}
                      onChangeText={(v) => updateField('telefone', formatBrazilPhoneInput(v))}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor={AppColors.text.quaternary}
                      style={styles.input}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={[styles.formGroup, styles.rowItem]}>
                    <Text style={styles.label}>E-mail *</Text>
                    <TextInput
                      value={form.email}
                      onChangeText={(v) => updateField('email', v)}
                      placeholder="contato@loja.com"
                      placeholderTextColor={AppColors.text.quaternary}
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Conte sobre seu comércio e objetivo da parceria</Text>
                  <TextInput
                    value={form.sobre}
                    onChangeText={(v) => updateField('sobre', v)}
                    placeholder="Descreva seu negócio e como deseja participar"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={[styles.input, styles.textArea]}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
                >
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enviar para análise</Text>
                </Pressable>
              </ScrollView>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={44} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Pedido enviado!</Text>
              <Text style={styles.successMessage}>
                Recebemos sua solicitação de parceria. Nossa equipe entrará em contato após a análise.
              </Text>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [styles.successClose, pressed && styles.submitButtonPressed]}
              >
                <Text style={styles.successCloseText}>Fechar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  panel: {
    maxHeight: '92%',
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  headerTextWrap: {
    flex: 1,
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 13,
    color: AppColors.gray[500],
    lineHeight: 19,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background.muted,
  },
  closeButtonPressed: {
    backgroundColor: AppColors.background.input,
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  input: {
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.border.muted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  formError: {
    fontSize: 13,
    color: AppColors.status.error,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: AppColors.primary,
    paddingVertical: 15,
    borderRadius: 14,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 14,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  successMessage: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 21,
  },
  successClose: {
    marginTop: 8,
    backgroundColor: AppColors.background.input,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  successCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
});
