import { AppColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function CitySkyline() {
  return (
    <View style={skylineStyles.wrap} pointerEvents="none">
      <View style={[skylineStyles.tree, { left: 8, height: 28 }]} />
      <View style={[skylineStyles.block, { left: 28, width: 22, height: 52 }]} />
      <View style={[skylineStyles.block, { left: 54, width: 18, height: 38 }]} />
      <View style={[skylineStyles.block, { left: 76, width: 26, height: 44 }]} />
      <View style={[skylineStyles.tower, { left: 108 }]}>
        <View style={skylineStyles.towerRoof} />
        <View style={skylineStyles.towerBody} />
      </View>
      <View style={[skylineStyles.block, { left: 138, width: 20, height: 48 }]} />
      <View style={[skylineStyles.block, { left: 162, width: 28, height: 56 }]} />
      <View style={[skylineStyles.block, { left: 194, width: 16, height: 40 }]} />
      <View style={[skylineStyles.block, { left: 214, width: 24, height: 50 }]} />
      <View style={[skylineStyles.tree, { right: 12, height: 32 }]} />
    </View>
  );
}

export default function ServicesHeroBanner() {
  return (
    <LinearGradient
      colors={['#E8F4FC', '#D6EBFA', '#F8FBFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <CitySkyline />
      <View style={styles.content}>
        <Text style={styles.title}>
          <Text style={styles.titleDark}>A cidade </Text>
          <Text style={styles.titleAccent}>na palma da sua mão.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Acesse serviços e informações de forma rápida e fácil.
        </Text>
        <View style={styles.accentBar} />
      </View>
    </LinearGradient>
  );
}

const skylineStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 260,
    height: 72,
    opacity: 0.35,
  },
  block: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#7BAFD4',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tower: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  towerRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6B9FC4',
    marginBottom: -1,
  },
  towerBody: {
    width: 18,
    height: 58,
    backgroundColor: '#7BAFD4',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tree: {
    position: 'absolute',
    bottom: 0,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#8BB8D8',
  },
});

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: -16,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 8,
    overflow: 'hidden',
    minHeight: 150,
  },
  content: {
    maxWidth: '68%',
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  titleDark: {
    color: '#1E3A8A',
  },
  titleAccent: {
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.tertiary,
    marginBottom: 12,
  },
  accentBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
});
