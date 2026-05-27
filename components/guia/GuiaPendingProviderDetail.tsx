import { AppColors } from '@/constants/theme';
import type { StoredGuiaProviderRegistration } from '@/services/guiaPendingProvidersStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatSubmittedAt(iso: string): string {
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

export default function GuiaPendingProviderDetail({
  registration,
}: {
  registration: StoredGuiaProviderRegistration;
}) {
  const isRejected = registration.status === 'REJECTED';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, isRejected ? styles.statusCardRejected : styles.statusCardPending]}>
          <Ionicons
            name={isRejected ? 'close-circle' : 'time-outline'}
            size={28}
            color={isRejected ? AppColors.status.error : '#64748b'}
          />
          <Text style={styles.statusTitle}>
            {isRejected ? 'Cadastro não aprovado' : 'Aguardando aprovação'}
          </Text>
          <Text style={styles.statusText}>
            {isRejected
              ? 'Seu cadastro foi analisado e não foi aprovado pelo administrativo da Rota. Entre em contato para mais informações.'
              : 'Seu cadastro foi recebido com sucesso e está em análise pelo administrativo da Rota. Assim que for aprovado, seu perfil ficará visível para todos no Guia da Cidade.'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{registration.displayName}</Text>
          <Text style={styles.infoService}>{registration.professionCustom}</Text>
          <Text style={styles.infoMeta}>Enviado em {formatSubmittedAt(registration.submittedAt)}</Text>

          <View style={styles.divider} />

          <InfoRow label="CNPJ" value={registration.cnpj} />
          <InfoRow label="Telefone" value={registration.phone} />
          <InfoRow label="E-mail" value={registration.email} />
          <InfoRow label="Área de atendimento" value={registration.serviceArea} />
          {registration.businessHours ? (
            <InfoRow label="Horário" value={registration.businessHours} />
          ) : null}
          <InfoRow label="Descrição" value={registration.description} />
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  infoService: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  infoMeta: {
    fontSize: 12,
    color: AppColors.text.quaternary,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  infoRow: { gap: 2, marginTop: 4 },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text.quaternary,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.secondary,
  },
});
