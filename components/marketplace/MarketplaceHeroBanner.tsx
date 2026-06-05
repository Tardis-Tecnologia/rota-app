import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type MarketplaceHeroBannerProps = {
  variant?: 'citizen' | 'commercial';
};

export default function MarketplaceHeroBanner({ variant = 'commercial' }: MarketplaceHeroBannerProps) {
  const isCitizen = variant === 'citizen';

  return (
    <LinearGradient
      colors={['#7c3aed', '#db2777', '#f97316']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.banner}
    >
      <View style={styles.badgeRow}>
        <Ionicons name="bag-handle-outline" size={14} color="#fff" />
        <Text style={styles.badgeText}>MARKETPLACE DO BAIRRO</Text>
      </View>
      <Text style={styles.title}>
        {isCitizen ? 'Produtos das lojas do bairro' : 'Vitrine da sua loja'}
      </Text>
      <Text style={styles.subtitle}>
        {isCitizen
          ? 'Encontre ofertas publicadas pelas lojas parceiras e fale direto pelo app.'
          : 'Publique produtos e gerencie os anúncios da sua loja.'}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
});
