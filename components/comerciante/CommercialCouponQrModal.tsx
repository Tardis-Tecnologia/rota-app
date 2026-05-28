import {
  buildCommercialCouponQrPayload,
  buildCouponQrImageUri,
} from '@/utils/commercialCouponQr';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type CommercialCouponQrModalProps = {
  visible: boolean;
  code: string;
  campaignName: string;
  onClose: () => void;
};

export default function CommercialCouponQrModal({
  visible,
  code,
  campaignName,
  onClose,
}: CommercialCouponQrModalProps) {
  const [copied, setCopied] = useState(false);

  const qrData = useMemo(() => {
    if (!visible || !code.trim()) return null;
    try {
      return buildCommercialCouponQrPayload(code);
    } catch {
      return null;
    }
  }, [visible, code]);

  if (!visible) {
    return null;
  }

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>QR do cupom</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          <Text style={styles.campaign} numberOfLines={2}>
            {campaignName}
          </Text>
          <Text style={styles.code}>{code}</Text>

          {qrData ? (
            <Image
              source={{ uri: buildCouponQrImageUri(qrData) }}
              style={styles.qr}
              accessibilityLabel="QR Code do cupom"
            />
          ) : (
            <Text style={styles.hint}>Código inválido para gerar QR.</Text>
          )}

          <Text style={styles.hint}>
            O cliente pode mostrar este QR na loja. A loja confere com o ID do cidadão no app.
          </Text>

          <Pressable style={styles.copyBtn} onPress={() => void handleCopy()}>
            <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
            <Text style={styles.copyBtnText}>
              {copied ? 'Código copiado!' : 'Copiar código'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  campaign: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  code: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0d9488',
    letterSpacing: 1,
  },
  qr: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
