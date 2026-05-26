import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type LostAnimalSortKey = 'recent' | 'oldest';

export type LostAnimalFilters = {
  species: string;
  breed: string;
  location: string;
  sort: LostAnimalSortKey;
};

export const EMPTY_LOST_ANIMAL_FILTERS: LostAnimalFilters = {
  species: '',
  breed: '',
  location: '',
  sort: 'recent',
};

interface LostAnimalsFiltersModalProps {
  visible: boolean;
  value: LostAnimalFilters;
  onClose: () => void;
  onApply: (filters: LostAnimalFilters) => void;
}

const SORT_OPTIONS: { key: LostAnimalSortKey; label: string }[] = [
  { key: 'recent', label: 'Mais recentes' },
  { key: 'oldest', label: 'Mais antigos' },
];

export default function LostAnimalsFiltersModal({
  visible,
  value,
  onClose,
  onApply,
}: LostAnimalsFiltersModalProps) {
  const [draft, setDraft] = useState<LostAnimalFilters>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const patch = (key: keyof LostAnimalFilters, v: string) => {
    setDraft((prev) => ({ ...prev, [key]: v }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={AppColors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Espécie</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Cão, Gato..."
              value={draft.species}
              onChangeText={(v) => patch('species', v)}
            />

            <Text style={styles.label}>Raça</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: SRD, Persa..."
              value={draft.breed}
              onChangeText={(v) => patch('breed', v)}
            />

            <Text style={styles.label}>Local</Text>
            <TextInput
              style={styles.input}
              placeholder="Bairro, praça, rua..."
              value={draft.location}
              onChangeText={(v) => patch('location', v)}
            />

            <Text style={styles.label}>Ordenar por</Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => {
                const active = draft.sort === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setDraft((prev) => ({ ...prev, sort: opt.key }))}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                  >
                    <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                setDraft(EMPTY_LOST_ANIMAL_FILTERS);
              }}
            >
              <Text style={styles.clearText}>Limpar</Text>
            </Pressable>
            <Pressable
              style={styles.applyBtn}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            >
              <Text style={styles.applyText}>Aplicar filtros</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  content: { padding: 16, gap: 6, paddingBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: AppColors.text.secondary,
  },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  sortChipActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  sortChipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  sortChipTextActive: { color: '#047857' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  clearText: { fontWeight: '700', color: AppColors.text.tertiary, fontSize: 15 },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  applyText: { fontWeight: '800', color: '#fff', fontSize: 15 },
});
