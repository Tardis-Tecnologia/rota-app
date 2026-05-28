import {
  formatValidUntilDisplay,
  parseValidUntilToIso,
  updateCommercialCoupon,
  type CommercialCoupon,
} from '@/services/commercialCouponsApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type EditCommercialCouponModalProps = {
  visible: boolean;
  cupom: CommercialCoupon | null;
  onClose: () => void;
  onSaved: (updated: CommercialCoupon) => void;
};

export default function EditCommercialCouponModal({
  visible,
  cupom,
  onClose,
  onSaved,
}: EditCommercialCouponModalProps) {
  const [name, setName] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [validade, setValidade] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cupom) return;
    setName(cupom.name);
    setDiscountPercent(String(cupom.discountPercent));
    setValidade(formatValidUntilDisplay(cupom.validUntil) ?? '');
    setError('');
  }, [cupom]);

  const handleSave = async () => {
    if (!cupom) return;
    if (!name.trim()) {
      setError('Informe o nome da campanha.');
      return;
    }
    const percent = Number.parseInt(discountPercent.trim(), 10);
    if (!discountPercent.trim() || Number.isNaN(percent) || percent < 1 || percent > 100) {
      setError('Desconto entre 1% e 100%.');
      return;
    }

    let validUntil: string | null | undefined;
    if (validade.trim()) {
      const iso = parseValidUntilToIso(validade);
      if (!iso) {
        setError('Validade inválida. Use DD/MM/AAAA.');
        return;
      }
      validUntil = iso;
    } else {
      validUntil = null;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await updateCommercialCoupon(cupom.id, {
        name: name.trim(),
        discountPercent: percent,
        validUntil,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar cupom</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          {cupom ? (
            <Text style={styles.codeLocked}>
              Código: {cupom.code} (não editável)
            </Text>
          ) : null}

          <Text style={styles.label}>Nome da campanha</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Desconto (%)</Text>
          <TextInput
            value={discountPercent}
            onChangeText={(v) => setDiscountPercent(v.replace(/[^0-9]/g, ''))}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={3}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Validade (DD/MM/AAAA, vazio = sem validade)</Text>
          <TextInput
            value={validade}
            onChangeText={setValidade}
            style={styles.input}
            placeholder="31/12/2026"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
            onPress={() => void handleSave()}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Salvar alterações</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 8,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  codeLocked: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
