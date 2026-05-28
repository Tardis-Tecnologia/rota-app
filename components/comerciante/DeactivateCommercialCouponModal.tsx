import type { CommercialCoupon } from '@/services/commercialCouponsApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type DeactivateCommercialCouponModalProps = {
  visible: boolean;
  cupom: CommercialCoupon | null;
  onClose: () => void;
  onConfirm: (cupom: CommercialCoupon) => Promise<void>;
};

export default function DeactivateCommercialCouponModal({
  visible,
  cupom,
  onClose,
  onConfirm,
}: DeactivateCommercialCouponModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (loading) return;
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!cupom || loading) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm(cupom);
      setError('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível desativar o cupom.');
    } finally {
      setLoading(false);
    }
  };

  if (!cupom) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} disabled={loading} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="ban-outline" size={26} color="#dc2626" />
          </View>

          <Text style={styles.title}>Desativar cupom?</Text>
          <Text style={styles.message}>
            O cupom{' '}
            <Text style={styles.code}>{cupom.code}</Text> deixará de aparecer como ativo para os
            clientes. O histórico de usos é mantido.
          </Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Campanha</Text>
            <Text style={styles.summaryValue}>{cupom.name}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={() => void handleConfirm()}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Desativar</Text>
              )}
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
    textAlign: 'center',
  },
  code: {
    fontWeight: '800',
    color: '#0d9488',
  },
  summaryBox: {
    width: '100%',
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#dc2626',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
