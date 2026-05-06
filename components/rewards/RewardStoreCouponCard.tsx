import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { CatalogReward } from '../../types/index';

const QR_DISPLAY = 192;
const cyan600 = '#0891b2';
const emerald50 = '#ecfdf5';
const emerald200 = '#a7f3d0';
const emerald300 = '#6ee7b7';
const emerald600 = '#059669';
const emerald700 = '#047857';
const emerald900 = '#064e3b';

interface RewardStoreCouponCardProps {
  reward: CatalogReward;
  isPurchased: boolean;
  couponCode?: string;
  isLoading: boolean;
  canBuyWithBalance: boolean;
  onLockedPress?: (reward: CatalogReward) => void;
  onRedeem: (rewardId: string, value: number) => void;
  onCopySuccess?: () => void;
}

function buildQrDataUri(code: string): string {
  const enc = encodeURIComponent(code);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${QR_DISPLAY}x${QR_DISPLAY}&data=${enc}`;
}

export default function RewardStoreCouponCard({
  reward,
  isPurchased,
  couponCode,
  isLoading,
  canBuyWithBalance,
  onLockedPress,
  onRedeem,
  onCopySuccess,
}: RewardStoreCouponCardProps) {
  const [qrVisible, setQrVisible] = useState(false);
  const cost = Math.abs(reward.value ?? 0);
  const brand = reward.name.trim().toUpperCase();
  const disabledBuy =
    Boolean(reward.disabled) || isLoading || isPurchased || !canBuyWithBalance;

  const qrSubtitle =
    reward.description?.trim() || reward.name.trim() || 'Cupom';

  const handleBuyPress = () => {
    if (isPurchased) return;
    if (!canBuyWithBalance && onLockedPress) {
      onLockedPress(reward);
      return;
    }
    void onRedeem(reward.id, reward.value ?? 0);
  };

  const handleCopy = useCallback(async () => {
    if (!couponCode) return;
    await Clipboard.setStringAsync(couponCode);
    onCopySuccess?.();
  }, [couponCode, onCopySuccess]);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.leftCol}>
            <Text style={styles.brand} numberOfLines={2}>
              {brand}
            </Text>
            {reward.description ? (
              <Text style={styles.desc} numberOfLines={3}>
                {reward.description}
              </Text>
            ) : null}
            <View style={styles.costRow}>
              <Ionicons name="star" size={16} color={AppColors.palette.purple.base} />
              <Text style={styles.cost}>{cost.toLocaleString('pt-BR')}</Text>
            </View>
          </View>
          {isPurchased ? (
            <View style={styles.pillComprado}>
              <Text style={styles.pillCompradoText}>Comprado</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.pillComprar, disabledBuy && styles.pillComprarMuted]}
              onPress={handleBuyPress}
              disabled={Boolean(reward.disabled) || isLoading}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillComprarText, disabledBuy && styles.pillComprarTextMuted]}>
                {isLoading ? 'Comprando…' : 'Comprar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isPurchased ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeHint}>Código de resgate disponível</Text>
            <View style={styles.codeRow}>
              <Text style={styles.code} numberOfLines={2}>
                {couponCode ?? '—'}
              </Text>
              <View style={styles.codeBtnGroup}>
                <TouchableOpacity
                  style={styles.btnCopiar}
                  onPress={() => {
                    void handleCopy();
                  }}
                  disabled={!couponCode}
                  activeOpacity={0.75}
                >
                  <Text style={styles.btnCopiarText}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnQrSmall}
                  onPress={() => setQrVisible(true)}
                  disabled={!couponCode}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnQrSmallText}>Gerar QR Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
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
            <Text style={styles.qrTitle}>QR Code do cupom</Text>
            <Text style={styles.qrSubtitle} numberOfLines={3}>
              {qrSubtitle}
            </Text>
            {couponCode ? (
              <Image
                source={{ uri: buildQrDataUri(couponCode) }}
                style={styles.qrImage}
                contentFit="contain"
                accessibilityLabel="QR Code do cupom"
              />
            ) : null}
            {couponCode ? (
              <Text style={styles.qrCodeFoot} selectable>
                {couponCode}
              </Text>
            ) : null}
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
    marginBottom: 0,
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
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: cyan600,
  },
  desc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
    lineHeight: 21,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  cost: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.palette.purple.base,
  },
  pillComprado: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#d1fae5',
    flexShrink: 0,
  },
  pillCompradoText: {
    fontSize: 14,
    fontWeight: '700',
    color: emerald700,
  },
  pillComprar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#e5e7eb',
    flexShrink: 0,
  },
  pillComprarMuted: {
    opacity: 1,
  },
  pillComprarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  pillComprarTextMuted: {
    color: '#6b7280',
  },
  codeBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: emerald50,
    borderWidth: 1,
    borderColor: emerald200,
  },
  codeHint: {
    fontSize: 12,
    fontWeight: '600',
    color: emerald700,
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
    color: emerald900,
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
    borderColor: emerald300,
  },
  btnCopiarText: {
    fontSize: 12,
    fontWeight: '600',
    color: emerald700,
  },
  btnQrSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: emerald600,
    borderWidth: 1,
    borderColor: emerald700,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
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
    lineHeight: 16,
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
