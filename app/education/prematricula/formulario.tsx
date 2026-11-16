import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

export default function PrematriculaFormScreen() {
  const { schoolName } = useLocalSearchParams<{ schoolId?: string; schoolName?: string }>();
  const [form, setForm] = useState({
    studentName: '',
    birthDate: '',
    guardianName: '',
    contactPhone: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const protocol = useMemo(() => `PM-2026-${Math.floor(1000 + Math.random() * 9000)}`, []);

  const canSubmit =
    form.studentName.trim() &&
    form.birthDate.trim() &&
    form.guardianName.trim() &&
    form.contactPhone.trim();

  if (submitted) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#047857" />
          </View>
          <Text style={styles.successTitle}>Pré-matrícula enviada</Text>
          <Text style={styles.successText}>
            Sua solicitação para {schoolName || 'a escola selecionada'} foi registrada com sucesso.
          </Text>
          <Text style={styles.protocol}>Protocolo {protocol}</Text>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.replace('/education/minhas-matriculas' as Href)}
          >
            <Text style={styles.secondaryBtnText}>Ver minhas matrículas</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/education' as Href)}>
            <Text style={styles.primaryBtnText}>Voltar à Educação</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.schoolBox}>
          <Text style={styles.schoolLabel}>Escola</Text>
          <Text style={styles.schoolName}>{schoolName || 'Escola selecionada'}</Text>
        </View>

        {(
          [
            ['studentName', 'Nome do aluno'],
            ['birthDate', 'Data de nascimento'],
            ['guardianName', 'Nome do responsável'],
            ['contactPhone', 'Telefone de contato'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key]}
              onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
              placeholder={label}
              placeholderTextColor={AppColors.text.quaternary}
            />
          </View>
        ))}

        <Pressable
          style={[styles.primaryBtn, !canSubmit && styles.disabled]}
          disabled={!canSubmit}
          onPress={() => setSubmitted(true)}
        >
          <Text style={styles.primaryBtnText}>Enviar pré-matrícula</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  schoolBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  schoolLabel: { fontSize: 12, color: AppColors.text.quaternary, fontWeight: '600' },
  schoolName: { marginTop: 4, fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  field: { marginBottom: 12 },
  label: { marginBottom: 6, fontSize: 13, fontWeight: '600', color: AppColors.text.tertiary },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.text.secondary,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  secondaryBtnText: { color: AppColors.primary, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  successWrap: { flex: 1, paddingTop: 8 },
  successCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  successIcon: { marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '800', color: AppColors.text.secondary },
  successText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.tertiary,
  },
  protocol: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.primary,
  },
});
