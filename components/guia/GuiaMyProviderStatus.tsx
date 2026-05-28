import { STATUS_UI } from '@/constants/serviceProviderStatus';
import { AppColors } from '@/constants/theme';
import { getServiceProviderById } from '@/services/serviceProvidersApi';
import type { ServiceProviderResponse } from '@/types/serviceProvider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const POLL_MS = 45_000;

function getProviderRejectionReason(provider: ServiceProviderResponse): string | null {
  const raw = provider as ServiceProviderResponse & Record<string, unknown>;
  const candidates = [
    raw.rejectionReason,
    raw.rejection_reason,
    raw.rejectionComment,
    raw.rejection_comment,
    raw.statusReason,
    raw.status_reason,
    raw.analysisNote,
    raw.adminNote,
    raw.reviewNote,
    raw.reason,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function GuiaMyProviderStatus({
  providerId,
  initial,
}: {
  providerId: string;
  initial: ServiceProviderResponse;
}) {
  const [provider, setProvider] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await getServiceProviderById(providerId);
      setProvider(data);
    } catch {
      // mantém último estado conhecido
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [providerId]);

  useEffect(() => {
    const id = setInterval(() => void refresh(true), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const ui = STATUS_UI[provider.status];
  const isRejected = provider.status === 'REJECTED';
  const rejectionReason = isRejected ? getProviderRejectionReason(provider) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>
        {refreshing ? <ActivityIndicator size="small" color="#64748b" /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.statusCard,
            isRejected ? styles.statusCardRejected : styles.statusCardPending,
          ]}
        >
          <Ionicons
            name={isRejected ? 'close-circle' : 'time-outline'}
            size={28}
            color={isRejected ? AppColors.status.error : '#64748b'}
          />
          <Text style={styles.statusTitle}>{ui.label}</Text>
          <Text style={styles.statusText}>
            {isRejected
              ? 'Seu cadastro foi analisado e não foi aprovado. Entre em contato com o administrativo da Rota para mais informações.'
              : 'Seu cadastro foi recebido e está em análise. Assim que for aprovado, seu perfil ficará visível para todos no Guia da Cidade.'}
          </Text>
          {rejectionReason ? (
            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Motivo da reprovação</Text>
              <Text style={styles.reasonText}>{rejectionReason}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{provider.name}</Text>
          <Text style={styles.infoService}>{provider.category}</Text>
          <Text style={styles.infoMeta}>Enviado em {formatDate(provider.createdAt)}</Text>

          <View style={styles.divider} />

          <InfoRow label="CNPJ" value={provider.cnpj} />
          <InfoRow label="Telefone" value={provider.phone} />
          {provider.email ? <InfoRow label="E-mail" value={provider.email} /> : null}
          {provider.locationName ? (
            <InfoRow label="Área de atendimento" value={provider.locationName} />
          ) : null}
          {provider.description ? <InfoRow label="Descrição" value={provider.description} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iconButton: { padding: 8 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  statusCard: {
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
  },
  statusCardPending: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  statusCardRejected: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.text.tertiary,
  },
  reasonCard: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7f1d1d',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  infoService: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  infoMeta: {
    fontSize: 12,
    color: AppColors.gray[500],
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  infoRow: { gap: 4, marginBottom: 8 },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.gray[500],
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
});
