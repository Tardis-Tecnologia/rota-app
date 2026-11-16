import { getMarketplaceCategoryMeta } from '@/constants/marketplaceCategories';
import { AppColors } from '@/constants/theme';
import type { MarketplaceListing } from '@/types/marketplace';
import { formatMarketplacePrice } from '@/utils/marketplaceFormat';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface MarketplaceProductCardProps {
  item: MarketplaceListing;
  onPress: () => void;
}

export default function MarketplaceProductCard({ item, onPress }: MarketplaceProductCardProps) {
  const cat = getMarketplaceCategoryMeta(item.category);
  const locationLine = [item.locationName, item.locationAddress].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.imagePlaceholder}>
          <Ionicons name="cube-outline" size={36} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      )}

      <View style={styles.body}>
        <View style={styles.sellerRow}>
          {item.sellerPhotoUrl ? (
            <Image source={{ uri: item.sellerPhotoUrl }} style={styles.sellerPhoto} />
          ) : (
            <View style={styles.sellerFallback}>
              <Text style={styles.sellerFallbackText}>
                {item.sellerName.trim().charAt(0).toUpperCase() || 'L'}
              </Text>
            </View>
          )}
          <Text style={styles.sellerName} numberOfLines={1}>
            {item.sellerName}
          </Text>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
          <Ionicons name={cat.icon} size={12} color={cat.color} />
          <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <Text style={styles.price}>{formatMarketplacePrice(item.price)}</Text>

        {locationLine ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={AppColors.text.tertiary} />
            <Text style={styles.location} numberOfLines={1}>
              {locationLine}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.96 },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: AppColors.gray[200],
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sellerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.gray[200],
  },
  sellerFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerFallbackText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6d28d9',
  },
  sellerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
    lineHeight: 24,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.text.quaternary,
    marginTop: 2,
  },
});
