import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RewardsModalBalanceProps {
  currentPoints: number;
  needsCpf: boolean;
  isLoadingPoints: boolean;
  pointsError: string | null;
  onRetryLoadPoints: () => void;
}

export default function RewardsModalBalance({
  currentPoints,
  needsCpf,
  isLoadingPoints,
  pointsError,
  onRetryLoadPoints,
}: RewardsModalBalanceProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Seu Saldo</Text>
      <View style={styles.valueRow}>
        <Ionicons name="star" size={20} color={AppColors.palette.purple.base} />
        <Text style={styles.value}>{currentPoints.toLocaleString('pt-BR')}</Text>
      </View>
      {needsCpf ? (
        <View style={styles.cpfWarning}>
          <Text style={styles.cpfWarningText}>
            Cadastre seu CPF para resgatar benefícios.
          </Text>
          <TouchableOpacity
            style={styles.cpfButton}
            onPress={() => router.push('/edit-account')}
            activeOpacity={0.7}
          >
            <Text style={styles.cpfButtonText}>Completar cadastro</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {isLoadingPoints ? (
        <Text style={styles.statusText}>Atualizando saldo...</Text>
      ) : null}
      {!isLoadingPoints && pointsError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{pointsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              void onRetryLoadPoints();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Recarregar saldo</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: AppColors.palette.purple.base,
  },
  cpfWarning: {
    marginTop: 8,
    alignItems: 'center',
  },
  cpfWarningText: {
    fontSize: 12,
    color: AppColors.status.warning,
    textAlign: 'center',
  },
  cpfButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: AppColors.status.warning,
  },
  cpfButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.white,
  },
  statusText: {
    marginTop: 6,
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  errorBox: {
    marginTop: 6,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: AppColors.status.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: AppColors.palette.purple.base,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.white,
  },
});
