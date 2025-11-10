import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface EnrollmentForm {
  studentName: string;
  birthDate: string;
  studentCpf: string;
  address: string;
  desiredGrade: string;
  motherName: string;
  fatherName: string;
  guardianName: string;
  guardianCpf: string;
  guardianPhone: string;
}

interface ModalCompleteEnrollmentProps {
  onClose?: () => void;
  onSubmit?: (data: EnrollmentForm) => void;
  initialData?: Partial<EnrollmentForm>;
}

const defaultForm: EnrollmentForm = {
  studentName: '',
  birthDate: '',
  studentCpf: '',
  address: '',
  desiredGrade: '',
  motherName: '',
  fatherName: '',
  guardianName: '',
  guardianCpf: '',
  guardianPhone: '',
};

export default function ModalCompleteEnrollment({
  onClose,
  onSubmit,
  initialData,
}: ModalCompleteEnrollmentProps) {
  const [form, setForm] = useState<EnrollmentForm>({ ...defaultForm, ...initialData });

  const handleChange = (key: keyof EnrollmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit?.(form);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Efetivar Matrícula</Text>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <Ionicons name="close" size={20} color={AppColors.text.tertiary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Aluno</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do aluno"
              value={form.studentName}
              onChangeText={(text) => handleChange('studentName', text)}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Nascimento</Text>
              <TextInput
                style={styles.input}
                placeholder="00/00/0000"
                value={form.birthDate}
                onChangeText={(text) => handleChange('birthDate', text)}
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                value={form.studentCpf}
                onChangeText={(text) => handleChange('studentCpf', text)}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Rua, número, bairro, cidade"
              value={form.address}
              onChangeText={(text) => handleChange('address', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Série Desejada</Text>
            <TextInput
              style={styles.input}
              placeholder="Informe a série"
              value={form.desiredGrade}
              onChangeText={(text) => handleChange('desiredGrade', text)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filiação</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Mãe</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome da mãe"
              value={form.motherName}
              onChangeText={(text) => handleChange('motherName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Pai (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do pai"
              value={form.fatherName}
              onChangeText={(text) => handleChange('fatherName', text)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Responsável</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do responsável"
              value={form.guardianName}
              onChangeText={(text) => handleChange('guardianName', text)}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                value={form.guardianCpf}
                onChangeText={(text) => handleChange('guardianCpf', text)}
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                value={form.guardianPhone}
                onChangeText={(text) => handleChange('guardianPhone', text)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos do Aluno (RG ou Certidão)</Text>
          <View style={styles.row}>
            <UploadSlot label="Frente do Documento" />
            <UploadSlot label="Verso do Documento" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Finalizar Matrícula</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

interface UploadSlotProps {
  label: string;
}

function UploadSlot({ label }: UploadSlotProps) {
  return (
    <Pressable style={({ pressed }) => [styles.uploadSlot, pressed && styles.uploadSlotPressed]}>
      <MaterialCommunityIcons
        name='cloud-upload-outline'
        size={28}
        color={AppColors.text.quaternary}
        style={styles.uploadIcon}
      />
      <Text style={styles.uploadLabel}>{label}</Text>
      <Text style={styles.uploadHint}>Toque para anexar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: AppColors.background.default,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 999,
  },
  closeButtonPressed: {
    backgroundColor: AppColors.background.overlay,
  },
  formContainer: {
    flexGrow: 0,
  },
  formContent: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
    paddingBottom: 6,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  input: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  rowItem: {
    flex: 1,
    gap: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
  },
  submitButton: {
    backgroundColor: AppColors.palette.indigo.base,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonPressed: {
    backgroundColor: AppColors.primaryDark,
  },
  submitText: {
    color: AppColors.text.white,
    fontSize: 16,
    fontWeight: '700',
  },
  uploadSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  uploadSlotPressed: {
    borderColor: AppColors.palette.indigo.base,
    backgroundColor: AppColors.background.overlay,
  },
  uploadIcon: {
    marginBottom: 8,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  uploadHint: {
    fontSize: 12,
    color: AppColors.text.quaternary,
    marginTop: 4,
  },
});

