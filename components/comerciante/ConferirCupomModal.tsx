import {
    checkCommercialCouponUsage,
    validateCommercialCoupon,
    type MarkCouponUsedResult,
} from '@/services/commercialCouponsApi';
import { parseCommercialCouponQr } from '@/utils/commercialCouponQr';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type ConferirCupomModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: MarkCouponUsedResult) => void;
};

const QR_INVALID_MSG =
  'QR inválido. Peça ao cliente que abra o cupom no app e toque em "QR na loja".';

export default function ConferirCupomModal({
  visible,
  onClose,
  onSuccess,
}: ConferirCupomModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);

  const resetState = useCallback(() => {
    setError('');
    setLoading(false);
    scanLockRef.current = false;
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const runValidate = async (code: string, userId: string) => {
    const check = await checkCommercialCouponUsage(code, userId);
    if (check.used) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Cliente já usou este cupom',
          `Uso anterior em ${check.usedAt ? new Date(check.usedAt).toLocaleString('pt-BR') : 'data desconhecida'}. Deseja registrar novamente? (permanece idempotente)`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continuar', onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) {
        scanLockRef.current = false;
        return;
      }
    }
    const result = await validateCommercialCoupon(code, userId);
    resetState();
    onSuccess(result);
    onClose();
  };

  const handleBarcode = (data: string) => {
    if (scanLockRef.current || loading) return;
    scanLockRef.current = true;
    setLoading(true);
    setError('');

    void (async () => {
      try {
        const { code, userId } = parseCommercialCouponQr(data);
        const userIdNorm = userId?.trim();
        if (!userIdNorm) {
          setError(QR_INVALID_MSG);
          scanLockRef.current = false;
          return;
        }
        await runValidate(code, userIdNorm);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível validar o cupom.');
        scanLockRef.current = false;
      } finally {
        setLoading(false);
      }
    })();
  };

  const renderScanner = () => {
    if (!permission) {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator color="#0d9488" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centerBlock}>
          <Ionicons name="camera-outline" size={48} color="#94a3b8" />
          <Text style={styles.permissionText}>
            Permita o acesso à câmera para escanear o QR Code que o cliente exibe no app.
          </Text>
          <Pressable
            style={styles.permissionBtn}
            onPress={() => void requestPermission()}
          >
            <Text style={styles.permissionBtnText}>Permitir câmera</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.scannerWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={({ data }) => handleBarcode(data)}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>
            Aponte para o QR Code do cliente (Loja de Recompensas → QR na loja)
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Conferir cupom</Text>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <Text style={styles.intro}>
          Escaneie apenas o QR gerado pelo cliente no app.
        </Text>

        {renderScanner()}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={styles.loadingText}>Validando cupom...</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  intro: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scannerWrap: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scannerFrame: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#14b8a6',
    backgroundColor: 'transparent',
  },
  scannerHint: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  permissionText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    marginHorizontal: 20,
    marginBottom: 12,
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
});
