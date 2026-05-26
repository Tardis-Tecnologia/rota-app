import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MarketplaceHeroBanner() {
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
      <Text style={styles.title}>Compre e venda perto de você</Text>
      <Text style={styles.subtitle}>
        Anúncios de produtos usados e novos — publique, negocie e encontre no app.
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
