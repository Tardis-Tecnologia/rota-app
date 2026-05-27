import { AppColors } from '@/constants/theme';
import type { GuiaListItem } from '@/services/guiaCatalog';
import { formatDistanceMeters } from '@/utils/guiaGeo';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GuiaProviderCardProps {
  item: GuiaListItem;
  onPress: () => void;
}

export default function GuiaProviderCard({ item, onPress }: GuiaProviderCardProps) {
  const distanceLabel =
    item.distanceMeters != null ? formatDistanceMeters(item.distanceMeters) : null;
  const isPending = item.approvalStatus === 'PENDING';

  return (
    <TouchableOpacity
      style={[styles.card, isPending && styles.cardPending]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.avatar, isPending && styles.avatarPending]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={[styles.avatarImage, isPending && styles.mediaPending]}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, isPending && styles.avatarPlaceholderPending]}>
            <Text style={[styles.avatarLetter, isPending && styles.textPending]}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, isPending && styles.textPending]} numberOfLines={1}>
          {item.name}
        </Text>
        {isPending ? (
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={12} color="#64748b" />
            <Text style={styles.pendingBadgeText}>Aguardando aprovação</Text>
          </View>
        ) : (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#EAB308" />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({item.review})</Text>
          </View>
        )}
        <Text style={[styles.category, isPending && styles.textPendingMuted]} numberOfLines={1}>
          {item.categoryLabel}
        </Text>
        {distanceLabel ? (
          <View style={styles.distanceRow}>
            <Ionicons name="navigate-outline" size={12} color={AppColors.gray[500]} />
            <Text style={[styles.distance, isPending && styles.textPendingMuted]}>
              {distanceLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.action}>
        <Text style={[styles.detailsLabel, isPending && styles.detailsLabelPending]}>
          {isPending ? 'Status' : 'Detalhes'}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isPending ? AppColors.gray[400] : '#7C3AED'}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  cardPending: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.88,
  },
  avatar: { marginRight: 12 },
  avatarPending: { opacity: 0.75 },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  mediaPending: { opacity: 0.55 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.palette.indigo.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderPending: {
    backgroundColor: AppColors.gray[200],
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.palette.indigo.base,
  },
  textPending: { color: AppColors.gray[500] },
  textPendingMuted: { color: AppColors.gray[400] },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rating: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  reviewCount: { fontSize: 12, color: AppColors.gray[500] },
  category: { fontSize: 13, color: AppColors.gray[500], marginTop: 2 },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distance: { fontSize: 12, fontWeight: '600', color: AppColors.gray[600] },
  action: { alignItems: 'flex-end', gap: 2, marginLeft: 8 },
  detailsLabel: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  detailsLabelPending: { color: AppColors.gray[500] },
});
