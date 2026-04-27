import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type EmergencyContact = {
  id: string;
  label: string;
  description: string;
  number: string;
  dotColor: string;
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'police',
    label: 'Polícia',
    description: 'Emergência policial',
    number: '190',
    dotColor: '#3B82F6',
  },
  {
    id: 'fire',
    label: 'Bombeiros',
    description: 'Corpo de Bombeiros',
    number: '193',
    dotColor: '#EF4444',
  },
  {
    id: 'domestic',
    label: 'Violência doméstica',
    description: 'Disque 180',
    number: '180',
    dotColor: '#8B5CF6',
  },
  {
    id: 'child',
    label: 'Criança / adolescente',
    description: 'Disque 100',
    number: '100',
    dotColor: '#F59E0B',
  },
];

export function EmergencyPhones() {
  const [expanded, setExpanded] = useState(false);

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
         <LinearGradient
          colors={['rgba(239, 68, 68, 0.1)', 'rgba(244, 63, 94, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerIcon}>
          <Ionicons name="call" size={22} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Telefones emergenciais</Text>
          <Text style={styles.subtitle}>Toque no número para ligar</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={AppColors.gray[500]}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {EMERGENCY_CONTACTS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.row,
                index < EMERGENCY_CONTACTS.length - 1 && styles.rowBorder,
              ]}
              onPress={() => handleCall(item.number)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: item.dotColor }]} />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDescription}>{item.description}</Text>
              </View>
              <Text style={styles.rowNumber}>{item.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.gray[500],
    marginTop: 2,
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,

  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text.primary,
  },
  rowDescription: {
    fontSize: 14,
    color: AppColors.gray[500],
    marginTop: 2,
  },
  rowNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 12,
  },
});