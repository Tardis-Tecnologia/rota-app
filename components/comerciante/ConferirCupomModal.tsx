import {
  checkCommercialCouponUsage,
  normalizeCommercialCouponCode,
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
  TextInput,
  View,
} from 'react-native';

type ConferirCupomModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: MarkCouponUsedResult) => void;
};

export default function ConferirCupomModal({
  visible,
  onClose,
  onSuccess,
}: ConferirCupomModalProps) {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [clientUserId, setClientUserId] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);

  const resetState = useCallback(() => {
    setClientUserId('');
    setManualCode('');
    setError('');
    setLoading(false);
    scanLockRef.current = false;
    setMode('scan');
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

  const submitCode = async (raw: string, userIdOverride?: string) => {
    if (loading) return;

    const userId = (userIdOverride ?? clientUserId).trim();
    if (!userId) {
      setError('Informe o ID do cliente (userId do app).');
      scanLockRef.current = false;
      return;
    }

    setLoading(true);
    setError('');
    try {
      let code: string;
      let qrUserId: string | undefined;
      try {
        const parsed = parseCommercialCouponQr(raw);
        code = parsed.code;
        qrUserId = parsed.userId;
      } catch {
        code = normalizeCommercialCouponCode(raw);
      }

      const finalUserId = (qrUserId ?? userId).trim();
      if (qrUserId) {
        setClientUserId(qrUserId);
      }

      await runValidate(code, finalUserId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível validar o cupom.');
      scanLockRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleBarcode = (data: string) => {
    if (scanLockRef.current || loading) return;
    scanLockRef.current = true;
    try {
      const parsed = parseCommercialCouponQr(data);
      if (parsed.userId) {
        setClientUserId(parsed.userId);
      }
      if (!clientUserId.trim() && !parsed.userId) {
        setError('QR sem userId. Informe o ID do cliente acima e escaneie de novo.');
        scanLockRef.current = false;
        return;
      }
      void submitCode(data, parsed.userId ?? clientUserId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'QR inválido.');
      scanLockRef.current = false;
    }
  };

  const handleManualSubmit = () => {
    void submitCode(manualCode);
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
          <Text style={styles.permissionText}>
            Permita o acesso à câmera para escanear o QR Code do cupom.
          </Text>
          <Pressable
            style={styles.permissionBtn}
            onPress={() => void requestPermission()}
          >
            <Text style={styles.permissionBtnText}>Permitir câmera</Text>
          </Pressable>
          <Pressable onPress={() => setMode('manual')}>
            <Text style={styles.linkText}>Digitar código manualmente</Text>
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
            QR com código do cupom (e userId, se disponível)
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

        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeBtn, mode === 'scan' && styles.modeBtnActive]}
            onPress={() => {
              setMode('scan');
              setError('');
              scanLockRef.current = false;
            }}
          >
            <Ionicons
              name="qr-code-outline"
              size={18}
              color={mode === 'scan' ? '#0d9488' : '#64748b'}
            />
            <Text style={[styles.modeBtnText, mode === 'scan' && styles.modeBtnTextActive]}>
              Escanear QR
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
            onPress={() => {
              setMode('manual');
              setError('');
              scanLockRef.current = false;
            }}
          >
            <Ionicons
              name="keypad-outline"
              size={18}
              color={mode === 'manual' ? '#0d9488' : '#64748b'}
            />
            <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
              Digitar código
            </Text>
          </Pressable>
        </View>

        <View style={styles.clientIdBlock}>
          <Text style={styles.clientIdLabel}>ID do cliente (app_user)</Text>
          <TextInput
            value={clientUserId}
            onChangeText={(v) => {
              setClientUserId(v);
              setError('');
            }}
            placeholder="UUID do cidadão no app"
            placeholderTextColor="#94a3b8"
            style={styles.clientIdInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {mode === 'scan' ? (
          renderScanner()
        ) : (
          <View style={styles.manualBlock}>
            <Text style={styles.manualLabel}>Código do cupom</Text>
            <TextInput
              value={manualCode}
              onChangeText={(v) => {
                setManualCode(v);
                setError('');
              }}
              placeholder="BANHO20 ou ROTA-CUP1-ABC123"
              placeholderTextColor="#94a3b8"
              style={styles.manualInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {manualCode.trim() ? (
              <Text style={styles.previewCode}>
                {(() => {
                  try {
                    return normalizeCommercialCouponCode(manualCode);
                  } catch {
                    return '—';
                  }
                })()}
              </Text>
            ) : null}
            <Pressable
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              disabled={loading || !manualCode.trim()}
              onPress={handleManualSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Validar cupom</Text>
              )}
            </Pressable>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading && mode === 'scan' ? (
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#FFFFFF',
  },
  modeBtnActive: {
    borderColor: '#0d9488',
    backgroundColor: '#ccfbf1',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modeBtnTextActive: {
    color: '#0d9488',
  },
  clientIdBlock: {
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 12,
  },
  clientIdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  clientIdInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  scannerWrap: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  },
  manualBlock: {
    paddingHorizontal: 20,
    gap: 12,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  manualInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  previewCode: {
    fontSize: 13,
    color: '#0d9488',
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
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
  linkText: {
    color: '#0d9488',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    marginHorizontal: 20,
    marginTop: 12,
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
