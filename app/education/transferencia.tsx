import { AppColors } from '@/constants/theme';
import { mockEnrollments, mockSchools } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const STEPS = ['Aluno', 'Destino', 'Motivo', 'Confirmar'] as const;

export default function TransferenciaScreen() {
  const [step, setStep] = useState(0);
  const [studentId, setStudentId] = useState(mockEnrollments[0]?.id ?? '');
  const [targetSchoolId, setTargetSchoolId] = useState('');
  const [reason, setReason] = useState('');
  const [attached, setAttached] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  const student = mockEnrollments.find((e) => e.id === studentId);
  const destinations = useMemo(
    () => mockSchools.filter((s) => s.id !== student?.schoolId && s.level !== 'INFANTIL'),
    [student?.schoolId],
  );
  const target = destinations.find((s) => s.id === targetSchoolId);

  if (protocol) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={48} color="#047857" />
          <Text style={styles.successTitle}>Transferência solicitada</Text>
          <Text style={styles.successText}>
            Pedido de transferência de {student?.studentName} registrado com sucesso.
          </Text>
          <Text style={styles.protocol}>{protocol}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.steps}>
        {STEPS.map((label, index) => (
          <View key={label} style={[styles.stepChip, index === step && styles.stepActive]}>
            <Text style={[styles.stepText, index === step && styles.stepTextActive]}>
              {index + 1}. {label}
            </Text>
          </View>
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.card}>
          <Text style={styles.title}>Selecione o aluno</Text>
          {mockEnrollments.map((e) => (
            <Pressable
              key={e.id}
              style={[styles.option, studentId === e.id && styles.optionActive]}
              onPress={() => setStudentId(e.id)}
            >
              <Text style={styles.optionTitle}>{e.studentName}</Text>
              <Text style={styles.optionMeta}>
                Atual: {e.school} · {e.series}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.card}>
          <Text style={styles.title}>Escola de destino</Text>
          <Text style={styles.hint}>Escola atual: {student?.school}</Text>
          {destinations.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.option, targetSchoolId === s.id && styles.optionActive]}
              onPress={() => setTargetSchoolId(s.id)}
            >
              <Text style={styles.optionTitle}>{s.name}</Text>
              <Text style={styles.optionMeta}>
                {s.region} · {s.address}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.card}>
          <Text style={styles.title}>Motivo e documentos</Text>
          <TextInput
            style={styles.input}
            multiline
            value={reason}
            onChangeText={setReason}
            placeholder="Descreva o motivo da transferência"
            placeholderTextColor={AppColors.text.quaternary}
          />
          <Pressable
            style={[styles.attach, attached && styles.attachDone]}
            onPress={() => {
              setAttached(true);
              Alert.alert('Anexo', 'Documento anexado.');
            }}
          >
            <Ionicons
              name={attached ? 'document-attach' : 'cloud-upload-outline'}
              size={18}
              color={attached ? '#047857' : AppColors.primary}
            />
            <Text style={styles.attachText}>
              {attached ? 'Histórico escolar anexado' : 'Anexar histórico'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.card}>
          <Text style={styles.title}>Confirmar solicitação</Text>
          <Text style={styles.summary}>Aluno: {student?.studentName}</Text>
          <Text style={styles.summary}>Origem: {student?.school}</Text>
          <Text style={styles.summary}>Destino: {target?.name}</Text>
          <Text style={styles.summary}>Motivo: {reason || '—'}</Text>
          <Text style={styles.summary}>Anexo: {attached ? 'Sim' : 'Não'}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Pressable style={styles.secondary} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.secondaryText}>Voltar etapa</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          style={styles.primary}
          onPress={() => {
            if (step === 0 && !studentId) return;
            if (step === 1 && !targetSchoolId) return;
            if (step === 2 && !reason.trim()) return;
            if (step < STEPS.length - 1) {
              setStep((s) => s + 1);
              return;
            }
            setProtocol(`TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`);
          }}
        >
          <Text style={styles.primaryText}>
            {step === STEPS.length - 1 ? 'Confirmar' : 'Continuar'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  stepChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  stepActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  stepText: { fontSize: 11, fontWeight: '700', color: AppColors.text.tertiary },
  stepTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  title: { fontSize: 16, fontWeight: '800', color: AppColors.text.secondary },
  hint: { fontSize: 13, color: AppColors.text.tertiary },
  option: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    padding: 12,
  },
  optionActive: { borderColor: AppColors.primary, backgroundColor: '#eff6ff' },
  optionTitle: { fontSize: 14, fontWeight: '700', color: AppColors.text.secondary },
  optionMeta: { marginTop: 2, fontSize: 12, color: AppColors.text.tertiary },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    color: AppColors.text.secondary,
  },
  attach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  attachDone: { backgroundColor: '#ecfdf5' },
  attachText: { fontWeight: '700', color: AppColors.text.secondary, fontSize: 13 },
  summary: { fontSize: 14, color: AppColors.text.secondary, lineHeight: 20 },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondary: { paddingVertical: 12, paddingHorizontal: 8 },
  secondaryText: { color: AppColors.text.tertiary, fontWeight: '700' },
  primary: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  successWrap: { flex: 1, paddingTop: 8 },
  successCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: AppColors.text.secondary },
  successText: { textAlign: 'center', color: AppColors.text.tertiary, lineHeight: 20 },
  protocol: { marginTop: 8, fontWeight: '800', color: AppColors.primary, fontSize: 16 },
});
