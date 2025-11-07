import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Alerta {
  id: string;
  titulo: string;
  descricao: string;
  tipo?: 'chuva' | 'calor' | 'vento' | 'outro';
}

export default function CityAlerts() {
  const alertas: Alerta[] = [
    {
      id: '1',
      titulo: 'Alerta de Chuva Forte',
      descricao: 'Risco de alagamentos em áreas baixas.',
      tipo: 'chuva',
    },
  ];

  if (alertas.length === 0) {
    return null;
  }

  const alerta = alertas[0]; // Por enquanto mostra apenas o primeiro

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas da Cidade</Text>
      </View>

      <View style={styles.alertCard}>
        <LinearGradient
          colors={[AppColors.alerts.primary, AppColors.alerts.secondary]}
          style={styles.iconContainer}
        >
          <Ionicons name="rainy-outline" size={32} color={AppColors.text.white} />
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.alertTitulo}>{alerta.titulo}</Text>
          <Text style={styles.alertDescricao}>{alerta.descricao}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  alertCard: {
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 24,
    shadowColor: AppColors.alerts.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.alerts.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  alertTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  alertDescricao: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
});

