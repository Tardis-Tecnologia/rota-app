import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedStormIconProps {
  color: string;
  size?: number;
}

export default function AnimatedStormIcon({ color, size = 28 }: AnimatedStormIconProps) {
  const sway = useSharedValue(0);
  const flash = useSharedValue(0.25);
  const boltScale = useSharedValue(0.92);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 700 }),
        withTiming(5, { duration: 700 }),
      ),
      -1,
      true,
    );
    flash.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 420 }),
        withTiming(1, { duration: 70 }),
        withTiming(0.35, { duration: 80 }),
        withTiming(1, { duration: 60 }),
        withTiming(0.45, { duration: 640 }),
      ),
      -1,
      false,
    );
    boltScale.value = withDelay(
      420,
      withRepeat(
        withSequence(
          withTiming(1.18, { duration: 70 }),
          withTiming(0.9, { duration: 140 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        false,
      ),
    );
  }, [boltScale, flash, sway]);

  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value}deg` }],
  }));

  const boltStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: boltScale.value }],
  }));

  const cloudSize = Math.round(size * 0.58);
  const boltSize = Math.round(size * 0.5);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={cloudStyle}>
        <Ionicons name="cloud" size={cloudSize} color={color} />
      </Animated.View>
      <Animated.View style={[styles.bolt, boltStyle]}>
        <Ionicons name="flash" size={boltSize} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolt: {
    marginTop: -3,
  },
});
