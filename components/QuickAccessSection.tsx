import { ModalEmergencyPhones } from '@/components/ModalEmergencyPhones';
import { AppColors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type QuickItem = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  iconColor: string;
  iconBg: string;
  accentColor: string;
  onPress: () => void;
};

export default function QuickAccessSection() {
  const router = useRouter();
  const [showEmergencyPhones, setShowEmergencyPhones] = useState(false);

  const items: QuickItem[] = [
    {
      id: 'missions',
      label: 'Missões',
      icon: 'target',
      iconColor: '#7C3AED',
      iconBg: '#EDE9FE',
      accentColor: '#7C3AED',
      onPress: () => router.push('/missions'),
    },
    {
      id: 'pulso',
      label: 'Pulso',
      icon: 'activity',
      iconColor: '#059669',
      iconBg: '#D1FAE5',
      accentColor: '#10B981',
      onPress: () => router.push('/pulso'),
    },
    {
      id: 'emergency',
      label: 'Emergência',
      icon: 'phone-call',
      iconColor: '#DC2626',
      iconBg: '#FEE2E2',
      accentColor: '#EF4444',
      onPress: () => setShowEmergencyPhones(true),
    },
  ];

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.title}>ACESSO RÁPIDO</Text>
        <View style={styles.row}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={item.onPress}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                <Feather name={item.icon} size={24} color={item.iconColor} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <View style={[styles.accent, { backgroundColor: item.accentColor }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ModalEmergencyPhones
        visible={showEmergencyPhones}
        onClose={() => setShowEmergencyPhones(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: AppColors.text.tertiary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    minHeight: 118,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  accent: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
});
