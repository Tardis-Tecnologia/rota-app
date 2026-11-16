import { AppColors } from '@/constants/theme';
import { useCityBrand } from '@/contexts/CityBrandContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export type WelcomeSplashMode = 'first' | 'returning';

interface WelcomeSplashProps {
  mode: WelcomeSplashMode;
  cityName: string;
}

export default function WelcomeSplash({ mode, cityName }: WelcomeSplashProps) {
  const brand = useCityBrand();
  const brandName = brand.displayName || `${cityName} Digital`;
  const title =
    mode === 'returning' ? `Bem-vindo de volta a ${brandName}` : `Bem-vindo a ${brandName}`;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);
  const logoScale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) });
    logoScale.value = withDelay(
      80,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
  }, [logoScale, opacity, translateY]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.root} accessibilityRole="summary">
      <LinearGradient
        colors={brand.gradient}
        start={{ x: 0.1, y: 0.05 }}
        end={{ x: 0.9, y: 0.95 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Animated.View style={[styles.logoMark, brand.logoUrl ? styles.logoPlate : null, logoStyle]}>
          {brand.logoUrl ? (
            <Image source={{ uri: brand.logoUrl }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Text style={styles.logoLetter}>{brandName.charAt(0).toUpperCase()}</Text>
          )}
        </Animated.View>
        <Animated.View style={textStyle}>
          <Text style={styles.eyebrow}>
            {mode === 'returning' ? 'Que bom te ver de novo' : 'Primeiro acesso'}
          </Text>
          <Text style={styles.title}>{title}</Text>
        </Animated.View>
        <ActivityIndicator style={styles.spinner} color={AppColors.text.white} size="small" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 18,
  },
  logoMark: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoPlate: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
  },
  logoImage: {
    width: 68,
    height: 68,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: '800',
    color: AppColors.text.white,
    letterSpacing: -1,
  },
  eyebrow: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.text.white,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  spinner: {
    marginTop: 10,
  },
});
