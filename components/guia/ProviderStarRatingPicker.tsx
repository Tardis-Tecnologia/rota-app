import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

const STAR_COLOR = '#EAB308';
const STAR_SIZE = 26;

type ProviderStarRatingPickerProps = {
  value: number | null;
  onSelect: (stars: number) => void;
  disabled?: boolean;
  saving?: boolean;
};

function starIconName(displayValue: number, starIndex: number): keyof typeof Ionicons.glyphMap {
  const full = starIndex;
  const half = starIndex - 0.5;
  if (displayValue >= full) return 'star';
  if (displayValue >= half) return 'star-half';
  return 'star-outline';
}

export default function ProviderStarRatingPicker({
  value,
  onSelect,
  disabled = false,
  saving = false,
}: ProviderStarRatingPickerProps) {
  const displayValue = value ?? 0;

  const handlePress = useCallback(
    (stars: number) => {
      if (disabled || saving) return;
      onSelect(stars);
    },
    [disabled, onSelect, saving],
  );

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const leftValue = starIndex === 1 ? 1 : starIndex - 0.5;
        const rightValue = starIndex;
        const icon = starIconName(displayValue, starIndex);

        return (
          <View key={starIndex} style={styles.starWrap}>
            <Pressable
              onPress={() => handlePress(leftValue)}
              disabled={disabled || saving}
              style={({ pressed }) => [styles.half, pressed && !disabled && styles.halfPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${leftValue} estrelas`}
            />
            <Pressable
              onPress={() => handlePress(rightValue)}
              disabled={disabled || saving}
              style={({ pressed }) => [styles.half, pressed && !disabled && styles.halfPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${rightValue} estrelas`}
            />
            <View style={styles.iconLayer} pointerEvents="none">
              <Ionicons name={icon} size={STAR_SIZE} color={STAR_COLOR} />
            </View>
          </View>
        );
      })}
      {saving ? (
        <ActivityIndicator size="small" color={STAR_COLOR} style={styles.spinner} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starWrap: {
    width: STAR_SIZE,
    height: STAR_SIZE,
    position: 'relative',
    flexDirection: 'row',
  },
  half: {
    flex: 1,
    height: '100%',
    zIndex: 2,
  },
  halfPressed: {
    opacity: 0.65,
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  spinner: {
    marginLeft: 6,
  },
});
