import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface TransportSearchCardProps {
  origin: string;
  destination: string;
  onChangeOrigin: (value: string) => void;
  onChangeDestination: (value: string) => void;
  onBackPress?: () => void;
}

export default function TransportSearchCard({
  origin,
  destination,
  onChangeOrigin,
  onChangeDestination,
  onBackPress,
}: TransportSearchCardProps) {
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    router.back();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="arrow-back-outline" size={22} color={AppColors.text.secondary} />
        </Pressable>
        <Text style={styles.title}>Transporte Público</Text>
      </View>

      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons
          name="record-circle-outline"
          size={22}
          color={AppColors.accent}
          style={styles.leadingIcon}
        />
        <TextInput
          value={origin}
          onChangeText={onChangeOrigin}
          placeholder="Local de partida"
          placeholderTextColor={AppColors.text.quaternary}
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="location-outline"
          size={22}
          color={AppColors.status.error}
          style={styles.leadingIcon}
        />
        <TextInput
          value={destination}
          onChangeText={onChangeDestination}
          placeholder="Para onde você vai?"
          placeholderTextColor={AppColors.text.quaternary}
          style={styles.input}
          returnKeyType="go"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.glass,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.overlay,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  leadingIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: AppColors.background.input,
    borderRadius: 999,
    paddingVertical: 12,
    paddingLeft: 48,
    paddingRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    color: AppColors.text.secondary,
  },
});

