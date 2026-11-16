import { AppColors } from '@/constants/theme';
import type { GuiaListItem } from '@/services/guiaCatalog';
import { formatDistanceMeters } from '@/utils/guiaGeo';
import { navigateToDirections } from '@/utils/navigateDirections';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function parseRouteCoord(value: string | undefined): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function GuiaPlaceDetail({ item }: { item: GuiaListItem }) {
  const { originLat, originLng } = useLocalSearchParams<{
    originLat?: string;
    originLng?: string;
  }>();
  const distanceLabel =
    item.distanceMeters != null ? formatDistanceMeters(item.distanceMeters) : null;

  const openDirections = () => {
    const fromLat = parseRouteCoord(originLat);
    const fromLng = parseRouteCoord(originLng);
    navigateToDirections({
      destLat: item.latitude,
      destLng: item.longitude,
      destName: item.name,
      ...(fromLat != null && fromLng != null ? { originLat: fromLat, originLng: fromLng } : {}),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="business" size={28} color="#7C3AED" />
          </View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.categoryLabel}</Text>
          {distanceLabel ? (
            <View style={styles.distanceRow}>
              <Ionicons name="navigate-outline" size={14} color="#64748b" />
              <Text style={styles.distance}>{distanceLabel}</Text>
            </View>
          ) : null}
        </View>

        {(item.address ?? item.serviceArea) ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Endereço</Text>
            <Text style={styles.infoValue}>{item.address ?? item.serviceArea}</Text>
          </View>
        ) : null}

        {item.about ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Sobre</Text>
            <Text style={styles.infoValue}>{item.about}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={openDirections}
          style={({ pressed }) => [styles.mapsBtn, pressed && styles.mapsBtnPressed]}
        >
          <Ionicons name="git-branch-outline" size={20} color="#fff" />
          <Text style={styles.mapsBtnText}>Como chegar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  topBar: { paddingHorizontal: 8, paddingVertical: 4 },
  iconButton: { padding: 8 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distance: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.gray[500],
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  mapsBtnPressed: { opacity: 0.9 },
  mapsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
