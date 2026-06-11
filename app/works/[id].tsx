import { AppColors } from '@/constants/theme';
import { parseJwtAccessTokenPayload } from '@/services/jwtAccessTokenClaims';
import { getAuthToken, getWhitelabelHostId } from '@/services/authApi';
import { getWorkById, type WorkResponseDto } from '@/services/worksApi';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function resolveHostIdForWorks(): string {
  const token = getAuthToken();
  if (token) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      const fromToken = (claims.hostId ?? claims.host ?? '')?.toString().trim();
      if (fromToken) return fromToken;
    } catch {
      // ignore
    }
  }
  return getWhitelabelHostId();
}

function formatDatePtBr(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export default function WorkDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = String(params.id ?? '').trim();
  const hostId = useMemo(() => resolveHostIdForWorks(), []);

  const [item, setItem] = useState<WorkResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!id) throw new Error('Obra inválida');
        const data = await getWorkById({ id, hostId });
        if (!mounted) return;
        setItem(data);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar obra');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [hostId, id]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={22} color={AppColors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhe da obra</Text>
        <View style={styles.headerBtn} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={AppColors.accent} />
          <Text style={styles.loadingText}>Carregando…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !item ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Obra não encontrada</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Descrição</Text>
            <Text style={styles.descBody}>
              {item.description?.trim() || 'Sem descrição cadastrada.'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Informações</Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Bairro: </Text>
              <Text style={styles.v}>{item.neighborhood || '-'}</Text>
            </Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Endereço: </Text>
              <Text style={styles.v}>{item.address || '-'}</Text>
            </Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Status: </Text>
              <Text style={styles.v}>{item.status || '-'}</Text>
            </Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Conclusão prevista: </Text>
              <Text style={styles.v}>{item.expectedEndDate ? formatDatePtBr(item.expectedEndDate) : '-'}</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Responsáveis</Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Órgão: </Text>
              <Text style={styles.v}>{item.responsibleAgency || '-'}</Text>
            </Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Empresa: </Text>
              <Text style={styles.v}>{item.company || '-'}</Text>
            </Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Fiscalização: </Text>
              <Text style={styles.v}>{item.inspection || '-'}</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Trânsito</Text>
            <Text style={styles.line}>
              <Text style={styles.k}>Impacto: </Text>
              <Text style={styles.v}>{item.trafficImpact || '-'}</Text>
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background.default },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: AppColors.text.secondary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: AppColors.gray[500], fontSize: 13, fontWeight: '600' },
  errorWrap: { padding: 16 },
  errorTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B', marginBottom: 6 },
  errorText: { fontSize: 13, color: '#7F1D1D' },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  section: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  descBody: { fontSize: 14, lineHeight: 21, color: '#334155', fontWeight: '500' },
  line: { fontSize: 13, lineHeight: 18, marginBottom: 6, color: '#0F172A' },
  k: { fontWeight: '900', color: '#0F172A' },
  v: { fontWeight: '600', color: '#334155' },
});

