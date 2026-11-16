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

interface AnimatedFloodIconProps {
  color: string;
  size?: number;
}

function Wave({ color, delayMs }: { color: string; delayMs: number }) {
  const translateX = useSharedValue(-4);

  useEffect(() => {
    translateX.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(4, { duration: 700 }),
          withTiming(-4, { duration: 700 }),
        ),
        -1,
        true,
      ),
    );
  }, [delayMs, translateX]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[styles.wave, { backgroundColor: color }, waveStyle]} />;
}

export default function AnimatedFloodIcon({ color, size = 28 }: AnimatedFloodIconProps) {
  const rise = useSharedValue(0);

  useEffect(() => {
    rise.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 800 }),
        withTiming(2, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [rise]);

  const waterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rise.value }],
  }));

  const iconSize = Math.round(size * 0.62);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={waterStyle}>
        <Ionicons name="water" size={iconSize} color={color} />
      </Animated.View>
      <View style={styles.waves}>
        <Wave color={color} delayMs={0} />
        <Wave color={color} delayMs={220} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  waves: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 6,
    marginTop: -2,
  },
  wave: {
    width: 8,
    height: 2,
    borderRadius: 2,
  },
});
