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

interface AnimatedRainIconProps {
  color: string;
  size?: number;
}

function RainDrop({ color, delayMs }: { color: string; delayMs: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    const fall = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(7, { duration: 380 }),
      withTiming(10, { duration: 120 }),
    );
    const fade = withSequence(
      withTiming(0.85, { duration: 0 }),
      withTiming(0.5, { duration: 320 }),
      withTiming(0, { duration: 180 }),
    );

    translateY.value = withDelay(delayMs, withRepeat(fall, -1, false));
    opacity.value = withDelay(delayMs, withRepeat(fade, -1, false));
  }, [delayMs, opacity, translateY]);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.drop, { backgroundColor: color }, dropStyle]} />;
}

export default function AnimatedRainIcon({ color, size = 28 }: AnimatedRainIconProps) {
  const cloudSize = Math.round(size * 0.64);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Ionicons name="cloud" size={cloudSize} color={color} style={styles.cloud} />
      <View style={styles.dropsRow}>
        <RainDrop color={color} delayMs={0} />
        <RainDrop color={color} delayMs={140} />
        <RainDrop color={color} delayMs={280} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloud: {
    marginBottom: -2,
  },
  dropsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 3,
    height: 12,
    marginTop: -1,
  },
  drop: {
    width: 2,
    height: 5,
    borderRadius: 1,
  },
});
