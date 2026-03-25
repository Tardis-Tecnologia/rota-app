import { AppColors } from '@/constants/theme';
import { distanceMeters } from '@/services/placesService';
import { PontoInteresse } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PlaceDetailsSheetProps {
  visible: boolean;
  ponto: PontoInteresse | null;
  userLng: number;
  userLat: number;
  onClose: () => void;
}

function formatDistanceMeters(userLng: number, userLat: number, ponto: PontoInteresse): string {
  const m = distanceMeters(
    [userLng, userLat],
    [ponto.longitude, ponto.latitude],
  );
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function PlaceDetailsSheet({
  visible,
  ponto,
  userLng,
  userLat,
  onClose,
}: PlaceDetailsSheetProps) {
  if (!ponto) return null;

  const openDirections = () => {
    const { latitude, longitude } = ponto;
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${latitude},${longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    void Linking.openURL(url);
  };

  const callPhone = () => {
    if (!ponto.telefone) return;
    const digits = ponto.telefone.replace(/\D/g, '');
    void Linking.openURL(`tel:${digits}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.sheetHeader}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={AppColors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.imageWrap}>
              <View style={styles.imageBox}>
                {ponto.photoUrl ? (
                  <Image source={{ uri: ponto.photoUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>{ponto.titulo.charAt(0)}</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.title}>{ponto.titulo}</Text>

            {ponto.descricao ? (
              <View style={styles.row}>
                <Ionicons name="location-outline" size={18} color={AppColors.text.tertiary} />
                <Text style={styles.rowText}>{ponto.descricao}</Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              {ponto.rating != null ? (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={18} color="#fbbf24" />
                  <Text style={styles.metaStrong}>{ponto.rating}</Text>
                  {ponto.userRatingsTotal != null ? (
                    <Text style={styles.metaMuted}>({ponto.userRatingsTotal})</Text>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={16} color={AppColors.text.tertiary} />
                <Text style={styles.metaMuted}>{formatDistanceMeters(userLng, userLat, ponto)}</Text>
              </View>
              {ponto.openNow !== undefined ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={ponto.openNow ? AppColors.status.success : AppColors.status.error}
                  />
                  <Text
                    style={[
                      styles.metaMuted,
                      { color: ponto.openNow ? AppColors.status.success : AppColors.status.error },
                    ]}
                  >
                    {ponto.openNow ? 'Aberto' : 'Fechado'}
                  </Text>
                </View>
              ) : null}
            </View>

            {ponto.formattedAddress ? (
              <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={18} color={AppColors.text.tertiary} />
                <Text style={styles.addressText}>{ponto.formattedAddress}</Text>
              </View>
            ) : null}

            {ponto.telefone ? (
              <View style={styles.row}>
                <Ionicons name="call-outline" size={18} color={AppColors.text.tertiary} />
                <Text style={styles.rowText}>{ponto.telefone}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.btnPrimary} onPress={openDirections} activeOpacity={0.85}>
              <Ionicons name="paper-plane-outline" size={20} color={AppColors.text.white} />
              <Text style={styles.btnPrimaryText}>Como chegar</Text>
            </TouchableOpacity>

            {ponto.telefone ? (
              <TouchableOpacity style={styles.btnSecondary} onPress={callPhone} activeOpacity={0.85}>
                <Ionicons name="call-outline" size={20} color={AppColors.text.secondary} />
                <Text style={styles.btnSecondaryText}>Ligar</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.background.default,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 28,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  imageWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  imageBox: {
    position: 'relative',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: AppColors.gray[200],
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text.tertiary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaStrong: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  metaMuted: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: AppColors.background.muted,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.tab.active,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.white,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.background.muted,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
});
