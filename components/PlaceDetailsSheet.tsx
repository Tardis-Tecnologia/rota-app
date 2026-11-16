import { AppColors } from '@/constants/theme';
import { explorePontoCommunityId } from '@/services/forumCommunityApi';
import { distanceMeters } from '@/services/placesService';
import { PontoInteresse } from '@/types';
import {
  explorePontoCommercialStoreId,
  openCommercialStoreFromMapPonto,
} from '@/utils/commercialStoreMap';
import { navigateToDirections } from '@/utils/navigateDirections';
import { enrichPlaceProfile } from '@/utils/placeProfileEnrichment';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PlaceDetailsSheetProps {
  visible: boolean;
  ponto: PontoInteresse | null;
  userLng: number;
  userLat: number;
  onClose: () => void;
  /** Traça a rota no mapa atual, sem abrir app externo. */
  onRequestDirections?: (ponto: PontoInteresse) => void;
}

function formatDistanceMeters(userLng: number, userLat: number, ponto: PontoInteresse): string {
  const m = distanceMeters([userLng, userLat], [ponto.longitude, ponto.latitude]);
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function PlaceDetailsSheet({
  visible,
  ponto,
  userLng,
  userLat,
  onClose,
  onRequestDirections,
}: PlaceDetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const profile = useMemo(() => (ponto ? enrichPlaceProfile(ponto) : null), [ponto]);

  if (!profile) return null;

  const communityId = explorePontoCommunityId(profile);
  const commercialStoreId = explorePontoCommercialStoreId(profile);
  const isPartner = !!commercialStoreId;

  const openDirections = () => {
    onClose();
    if (onRequestDirections) {
      onRequestDirections(profile);
      return;
    }
    navigateToDirections({
      destLat: profile.latitude,
      destLng: profile.longitude,
      destName: profile.titulo,
      originLat: userLat,
      originLng: userLng,
    });
  };

  const openProfile = () => {
    if (!commercialStoreId) return;
    onClose();
    openCommercialStoreFromMapPonto(profile, router);
  };

  const openCommunity = () => {
    if (!communityId) return;
    onClose();
    router.push({
      pathname: '/forum/communities/[id]',
      params: { id: communityId },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.simpleHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={2}>
                {profile.titulo}
              </Text>
              <Text style={styles.metaMuted}>{formatDistanceMeters(userLng, userLat, profile)}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={18} color={AppColors.text.secondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnPrimaryFull} onPress={openDirections} activeOpacity={0.85}>
            <Ionicons name="git-branch-outline" size={18} color={AppColors.text.white} />
            <Text style={styles.btnPrimaryText}>Como chegar</Text>
          </TouchableOpacity>
          {isPartner ? (
            <TouchableOpacity style={styles.btnSecondaryFull} onPress={openProfile} activeOpacity={0.85}>
              <Ionicons name="storefront-outline" size={18} color="#b45309" />
              <Text style={styles.btnSecondaryText}>Ver perfil</Text>
            </TouchableOpacity>
          ) : null}
          {communityId ? (
            <TouchableOpacity style={styles.btnSecondaryFull} onPress={openCommunity} activeOpacity={0.85}>
              <Ionicons name="people-outline" size={18} color="#0891b2" />
              <Text style={[styles.btnSecondaryText, { color: '#0891b2' }]}>Ver comunidade</Text>
            </TouchableOpacity>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.background.default,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.gray[300],
    marginBottom: 2,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  photoWrap: {
    width: '100%',
    height: 168,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: AppColors.gray[200],
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLetter: {
    fontSize: 42,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  photoArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoArrowLeft: { left: 8 },
  photoArrowRight: { right: 8 },
  photoDots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  photoDotActive: {
    backgroundColor: '#fff',
    width: 14,
  },
  photoExpandHint: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { gap: 4 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaStrong: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  metaMuted: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  addressLine: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.text.tertiary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.tab.active,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimaryFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.tab.active,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  btnSecondaryFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff7ed',
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b45309',
  },
  btnMessage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkBtn: { paddingVertical: 2 },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0891b2',
  },
  reviewsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  reviewsSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '55%',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  reviewsScroll: { maxHeight: 280 },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.text.tertiary,
  },
  reviewTime: {
    marginTop: 4,
    fontSize: 11,
    color: AppColors.gray[400],
  },
});
