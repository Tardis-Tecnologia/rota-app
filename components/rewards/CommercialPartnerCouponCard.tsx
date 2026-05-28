import { AppColors } from '@/constants/theme';
import type { CommercialCouponCatalogItem } from '@/services/commercialCouponsApi';
import { formatValidUntilDisplay } from '@/services/commercialCouponsApi';
import { buildCommercialCouponQrPayload, buildCouponQrImageUri } from '@/utils/commercialCouponQr';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const QR_DISPLAY = 192;
const cyan600 = '#0891b2';

type CommercialPartnerCouponCardProps = {
  coupon: CommercialCouponCatalogItem;
  citizenUserId?: string;
  onCopySuccess?: () => void;
};

export default function CommercialPartnerCouponCard({
  coupon,
  citizenUserId,
  onCopySuccess,
}: CommercialPartnerCouponCardProps) {
  const [qrVisible, setQrVisible] = useState(false);

  const validUntilLabel = formatValidUntilDisplay(coupon.validUntil);
  const userIdNorm = citizenUserId?.trim() ?? '';

  const qrPayload = useMemo(() => {
    if (!userIdNorm) return null;
    try {
      return buildCommercialCouponQrPayload(coupon.code, userIdNorm);
    } catch {
      return null;
    }
  }, [coupon.code, userIdNorm]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(coupon.code);
    onCopySuccess?.();
  }, [coupon.code, onCopySuccess]);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.leftCol}>
            <Text style={styles.storeName} numberOfLines={1}>
              {coupon.storeName.trim().toUpperCase()}
            </Text>
            <Text style={styles.campaign} numberOfLines={2}>
              {coupon.name}
            </Text>
            {coupon.segment ? (
              <Text style={styles.segment}>{coupon.segment}</Text>
            ) : null}
            <View style={styles.discountRow}>
              <Ionicons name="pricetag" size={16} color={cyan600} />
              <Text style={styles.discount}>{coupon.discountPercent}% OFF</Text>
            </View>
            {validUntilLabel ? (
              <Text style={styles.validUntil}>Válido até {validUntilLabel}</Text>
            ) : null}
          </View>
          <View style={styles.pillLoja}>
            <Text style={styles.pillLojaText}>Loja parceira</Text>
          </View>
        </View>

        <View style={styles.codeBox}>
          <Text style={styles.codeHint}>
            Na loja, mostre o QR abaixo para validar o desconto.
          </Text>
          <View style={styles.codeRow}>
            <Text style={styles.code} numberOfLines={2}>
              {coupon.code}
            </Text>
            <View style={styles.codeBtnGroup}>
              <TouchableOpacity
                style={styles.btnCopiar}
                onPress={() => void handleCopy()}
                activeOpacity={0.75}
              >
                <Text style={styles.btnCopiarText}>Copiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnQrSmall, !qrPayload && styles.btnQrSmallDisabled]}
                onPress={() => setQrVisible(true)}
                disabled={!qrPayload}
                activeOpacity={0.8}
              >
                <Text style={styles.btnQrSmallText}>Gerar QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>
          {!userIdNorm ? (
            <Text style={styles.loginHint}>Faça login para gerar o QR de validação na loja.</Text>
          ) : null}
        </View>
      </View>

      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={styles.qrOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setQrVisible(false)}
          />
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>QR para usar na loja</Text>
            <Text style={styles.qrSubtitle} numberOfLines={2}>
              {coupon.storeName} — {coupon.name}
            </Text>
            <Text style={styles.qrExplain}>
              A loja escaneia este QR.
            </Text>
            {qrPayload ? (
              <Image
                source={{ uri: buildCouponQrImageUri(qrPayload) }}
                style={styles.qrImage}
                contentFit="contain"
                accessibilityLabel="QR Code para validação na loja"
              />
            ) : null}
            <Text style={styles.qrCodeFoot} selectable>
              {coupon.code}
            </Text>
            <TouchableOpacity
              style={styles.qrClose}
              onPress={() => setQrVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.qrCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
  },
  storeName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: cyan600,
  },
  campaign: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
    lineHeight: 21,
  },
  segment: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  discount: {
    fontSize: 14,
    fontWeight: '700',
    color: cyan600,
  },
  validUntil: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  pillLoja: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#ecfeff',
    flexShrink: 0,
  },
  pillLojaText: {
    fontSize: 11,
    fontWeight: '700',
    color: cyan600,
  },
  codeBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  codeHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    lineHeight: 17,
  },
  loginHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#b45309',
    fontWeight: '500',
  },
  codeRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  code: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '700',
    color: '#064e3b',
  },
  codeBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  btnCopiar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  btnCopiarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  btnQrSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#047857',
  },
  btnQrSmallDisabled: {
    opacity: 0.45,
  },
  btnQrSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.white,
  },
  qrOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 24,
  },
  qrCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  qrExplain: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  qrImage: {
    width: QR_DISPLAY,
    height: QR_DISPLAY,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrCodeFoot: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  qrClose: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignSelf: 'stretch',
  },
  qrCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text.white,
    textAlign: 'center',
  },
});
