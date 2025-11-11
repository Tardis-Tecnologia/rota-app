import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type ModalRegisterProps = {
  visible: boolean;
  onClose: () => void;
  schoolName: string;
};
export default function ModalRegister({
  visible,
  onClose,
  schoolName,
}: ModalRegisterProps) {
  const [form, setForm] = useState({
    studentName: '',
    birthDate: '',
    guardianName: '',
    contactPhone: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setForm({
      studentName: '',
      birthDate: '',
      guardianName: '',
      contactPhone: '',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {!isSubmitted ? (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Pré-matrícula</Text>
                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.iconButtonPressed,
                  ]}
                >
                  <Ionicons name="close" size={22} color={AppColors.text.tertiary} />
                </Pressable>
              </View>

              <View style={styles.content}>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Escola:</Text>
                  <Text style={styles.sectionValue}>{schoolName}</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nome do Aluno(a)</Text>
                  <TextInput
                    value={form.studentName}
                    onChangeText={(value) => handleChange('studentName', value)}
                    placeholder="Informe o nome completo"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={styles.input}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Data de Nascimento</Text>
                  <TextInput
                    value={form.birthDate}
                    onChangeText={(value) => handleChange('birthDate', value)}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={styles.input}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nome do Responsável</Text>
                  <TextInput
                    value={form.guardianName}
                    onChangeText={(value) => handleChange('guardianName', value)}
                    placeholder="Nome completo do responsável"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={styles.input}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Telefone de Contato</Text>
                  <TextInput
                    value={form.contactPhone}
                    onChangeText={(value) => handleChange('contactPhone', value)}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                    placeholderTextColor={AppColors.text.quaternary}
                    style={styles.input}
                  />
                </View>

                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.submitButtonPressed,
                  ]}
                >
                  <Text style={styles.submitButtonText}>Confirmar Pré-matrícula</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={44} color={AppColors.text.white} />
              </View>
              <Text style={styles.successTitle}>Sucesso!</Text>
              <Text style={styles.successMessage}>
                Sua solicitação de pré-matrícula foi enviada. Você pode acompanhar o
                status na aba "Minhas Matrículas".
              </Text>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: AppColors.background.light,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
  },
  iconButtonPressed: {
    backgroundColor: AppColors.background.input,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  input: {
    backgroundColor: AppColors.background.default,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  submitButtonPressed: {
    backgroundColor: '#4f46e5',
  },
  submitButtonText: {
    color: AppColors.text.white,
    fontSize: 15,
    fontWeight: '600',
  },
  successContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonPressed: {
    backgroundColor: '#cbd5f5',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
});