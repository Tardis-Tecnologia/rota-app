import { AppColors } from '@/constants/theme';
import { mockSchools } from '@/services/educationMocks';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const CATEGORIES = ['Reclamação', 'Sugestão', 'Elogio', 'Denúncia', 'Outros'];

export default function OuvidoriaScreen() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [schoolId, setSchoolId] = useState('');
  const [description, setDescription] = useState('');
  const [attached, setAttached] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  if (protocol) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Manifestação registrada</Text>
          <Text style={styles.successText}>
            Sua mensagem foi enviada com sucesso.
          </Text>
          <Text style={styles.protocol}>{protocol}</Text>
          <Text style={styles.hint}>Acompanhe em Solicitações pelo protocolo acima.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Categoria</Text>
      <View style={styles.wrapChips}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Escola relacionada (opcional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <Pressable
          style={[styles.chip, !schoolId && styles.chipActive]}
          onPress={() => setSchoolId('')}
        >
          <Text style={[styles.chipText, !schoolId && styles.chipTextActive]}>Nenhuma</Text>
        </Pressable>
        {mockSchools.map((s) => (
          <Pressable
            key={s.id}
            style={[styles.chip, schoolId === s.id && styles.chipActive]}
            onPress={() => setSchoolId(s.id)}
          >
            <Text style={[styles.chipText, schoolId === s.id && styles.chipTextActive]} numberOfLines={1}>
              {s.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={styles.input}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="Descreva sua manifestação"
        placeholderTextColor={AppColors.text.quaternary}
      />

      <Pressable
        style={styles.attach}
        onPress={() => {
          setAttached(true);
          Alert.alert('Anexo', 'Arquivo anexado.');
        }}
      >
        <Text style={styles.attachText}>
          {attached ? 'Anexo adicionado' : 'Anexar arquivo (opcional)'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.submit, !description.trim() && styles.disabled]}
        disabled={!description.trim()}
        onPress={() => setProtocol(`OUV-2026-${Math.floor(1000 + Math.random() * 9000)}`)}
      >
        <Text style={styles.submitText}>Enviar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  label: {
    marginBottom: 8,
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
  },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chips: { flexGrow: 0, marginBottom: 8 },
  chip: {
    marginRight: 8,
    marginBottom: 4,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: AppColors.text.tertiary },
  chipTextActive: { color: '#fff' },
  input: {
    minHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    padding: 12,
    textAlignVertical: 'top',
    color: AppColors.text.secondary,
  },
  attach: {
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
  },
  attachText: { color: AppColors.primary, fontWeight: '700' },
  submit: {
    marginTop: 16,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.45 },
  successWrap: { flex: 1, paddingTop: 8 },
  successCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text.secondary },
  successText: { textAlign: 'center', color: AppColors.text.tertiary },
  protocol: { marginTop: 6, fontSize: 16, fontWeight: '800', color: AppColors.primary },
  hint: { fontSize: 12, color: AppColors.text.quaternary, textAlign: 'center' },
});
