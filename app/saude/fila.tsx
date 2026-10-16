import { Badge, Card, InfoRow, ScreenHeader, StateView, ps, type BadgeTone } from '@/components/publicServices/ui';
import {
  REFERRAL_PRIORITY_LABELS,
  REFERRAL_STATUS_LABELS,
  formatSlotDateTime,
  getMyReferrals,
  type Referral,
  type ReferralStatus,
} from '@/services/healthApi';
import { isoDateToBr } from '@/services/publicServicesHttp';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const statusTone: Record<ReferralStatus, BadgeTone> = {
  WAITING: 'warning',
  SCHEDULED: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
};

export default function FilaEspecialistaScreen() {
  const [items, setItems] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await getMyReferrals());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Fila de especialista" />
      {loading || error || items.length === 0 ? (
        <StateView
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyIcon="people-outline"
          emptyTitle="Nenhum encaminhamento"
          emptyMessage="Quando sua UBS encaminhar você para um especialista, a posição na fila aparece aqui."
          onRetry={() => void load()}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          ListHeaderComponent={
            <Text style={styles.intro}>
              A fila é organizada pela regulação: casos urgentes e prioritários passam na frente, depois
              a ordem de chegada. Puxe para baixo para atualizar.
            </Text>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.top}>
                <View style={styles.flex}>
                  <Text style={styles.specialty}>{item.specialty}</Text>
                  <Text style={styles.meta}>
                    {item.patientName} · encaminhado em {isoDateToBr(item.createdAt)}
                  </Text>
                </View>
                <Badge label={REFERRAL_STATUS_LABELS[item.status]} tone={statusTone[item.status]} />
              </View>

              {item.status === 'WAITING' && item.queuePosition ? (
                <View style={styles.queueBox} accessibilityLabel={`Posição ${item.queuePosition} de ${item.queueTotal ?? ''}`}>
                  <Text style={styles.queueNumber}>{item.queuePosition}º</Text>
                  <Text style={styles.queueText}>
                    na fila de {item.specialty.toLowerCase()}
                    {item.queueTotal ? ` (${item.queueTotal} aguardando)` : ''}
                  </Text>
                </View>
              ) : null}

              {item.status === 'SCHEDULED' && item.scheduledAt ? (
                <View style={styles.scheduledBox}>
                  <InfoRow icon="calendar-outline" text={formatSlotDateTime(item.scheduledAt)} />
                  {item.scheduledPlace ? <InfoRow icon="location-outline" text={item.scheduledPlace} /> : null}
                </View>
              ) : null}

              <InfoRow icon="flag-outline" text={`Classificação: ${REFERRAL_PRIORITY_LABELS[item.priority]}`} />
              {item.originUnit ? <InfoRow icon="business-outline" text={`Origem: ${item.originUnit.name}`} /> : null}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ps.surface },
  flex: { flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 40, backgroundColor: ps.page, flexGrow: 1 },
  intro: { fontSize: 13, color: ps.muted, lineHeight: 19 },
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  specialty: { fontSize: 16, fontWeight: '700', color: ps.title },
  meta: { fontSize: 13, color: ps.muted, marginTop: 2 },
  queueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  queueNumber: { fontSize: 28, fontWeight: '800', color: '#1D4ED8' },
  queueText: { flex: 1, fontSize: 14, color: '#1E3A8A', fontWeight: '600' },
  scheduledBox: { gap: 6, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12 },
});
