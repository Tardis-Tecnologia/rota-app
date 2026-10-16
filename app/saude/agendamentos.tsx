import {
  Badge,
  Card,
  InfoRow,
  PrimaryButton,
  ScreenHeader,
  StateView,
  ps,
  type BadgeTone,
} from '@/components/publicServices/ui';
import {
  cancelAppointmentReminder,
  scheduleAppointmentReminder,
} from '@/services/appointmentReminders';
import {
  APPOINTMENT_STATUS_LABELS,
  cancelAppointment,
  formatSlotDateTime,
  getMyAppointments,
  kindLabel,
  type Appointment,
  type AppointmentStatus,
} from '@/services/healthApi';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const statusTone: Record<AppointmentStatus, BadgeTone> = {
  SCHEDULED: 'info',
  ATTENDED: 'success',
  NO_SHOW: 'warning',
  CANCELLED: 'neutral',
};

export default function MeusAgendamentosScreen() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // Momento da última carga: separa próximos atendimentos do histórico.
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await getMyAppointments();
      const now = Date.now();
      setItems(list);
      setLoadedAt(now);
      setError(null);
      // Mantém os lembretes de 24h em dia (inclusive se algo mudou pelo painel).
      for (const a of list) {
        if (a.status === 'SCHEDULED' && new Date(a.startsAt).getTime() > now) {
          void scheduleAppointmentReminder(a);
        } else {
          void cancelAppointmentReminder(a.id);
        }
      }
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

  const isUpcoming = useCallback(
    (a: Appointment) => a.status === 'SCHEDULED' && new Date(a.startsAt).getTime() > loadedAt,
    [loadedAt],
  );

  const sections = useMemo(() => {
    const upcoming = items.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = items.filter((a) => !upcoming.includes(a));
    return [
      ...(upcoming.length ? [{ title: 'Próximos atendimentos', data: upcoming }] : []),
      ...(past.length ? [{ title: 'Histórico', data: past }] : []),
    ];
  }, [items, isUpcoming]);

  const confirmCancel = (item: Appointment) => {
    Alert.alert(
      'Cancelar atendimento',
      `Cancelar ${item.specialty} em ${formatSlotDateTime(item.startsAt)}? O horário será liberado para outra pessoa.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(item.id);
            try {
              await cancelAppointment(item.id);
              await cancelAppointmentReminder(item.id);
              await load(true);
            } catch (e) {
              Alert.alert('Não foi possível cancelar', e instanceof Error ? e.message : '');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  const reschedule = (item: Appointment) => {
    router.push({
      pathname: '/saude/agendar',
      params: {
        kind: item.kind,
        rescheduleId: item.id,
        unitId: item.unit.id,
        specialty: item.specialty,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Meus agendamentos" />
      {loading || error || items.length === 0 ? (
        <View style={styles.stateWrap}>
          <StateView
            loading={loading}
            error={error}
            empty={!loading && !error && items.length === 0}
            emptyIcon="calendar-outline"
            emptyTitle="Nenhum agendamento"
            emptyMessage="Agende consultas e exames na sua UBS pelo aplicativo."
            onRetry={() => void load()}
          />
          {!loading && !error ? (
            <PrimaryButton
              label="Agendar consulta"
              onPress={() => router.replace({ pathname: '/saude/agendar', params: { kind: 'CONSULTATION' } })}
            />
          ) : null}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => {
            const upcoming = isUpcoming(item);
            return (
              <Card style={styles.card}>
                <View style={styles.top}>
                  <View style={styles.flex}>
                    <Text style={styles.kind}>{kindLabel(item.kind)}</Text>
                    <Text style={styles.specialty}>{item.specialty}</Text>
                    <Text style={styles.when}>{formatSlotDateTime(item.startsAt)}</Text>
                  </View>
                  <Badge label={APPOINTMENT_STATUS_LABELS[item.status]} tone={statusTone[item.status]} />
                </View>
                <InfoRow icon="business-outline" text={item.unit.name} />
                {item.unit.address ? <InfoRow icon="location-outline" text={item.unit.address} /> : null}
                <InfoRow icon="person-outline" text={`Paciente: ${item.patientName}`} />
                {item.professionalName ? <InfoRow icon="medkit-outline" text={item.professionalName} /> : null}
                {upcoming ? (
                  <>
                    <View style={styles.actions}>
                      <View style={styles.flex}>
                        <PrimaryButton label="Remarcar" variant="outline" icon="swap-horizontal-outline" onPress={() => reschedule(item)} />
                      </View>
                      <View style={styles.flex}>
                        <PrimaryButton
                          label="Cancelar"
                          variant="danger"
                          loading={cancellingId === item.id}
                          onPress={() => confirmCancel(item)}
                        />
                      </View>
                    </View>
                    {item.unit.phone ? (
                      <PrimaryButton
                        label={`Ligar para a unidade`}
                        variant="outline"
                        icon="call-outline"
                        onPress={() => void Linking.openURL(`tel:${item.unit.phone!.replace(/[^\d+]/g, '')}`)}
                      />
                    ) : null}
                  </>
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ps.surface },
  flex: { flex: 1 },
  stateWrap: { flex: 1, padding: 16, backgroundColor: ps.page },
  list: { padding: 16, gap: 12, paddingBottom: 40, backgroundColor: ps.page, flexGrow: 1 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: ps.muted, textTransform: 'uppercase', marginTop: 4 },
  card: { gap: 8 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  kind: { fontSize: 12, fontWeight: '700', color: ps.muted, textTransform: 'uppercase' },
  specialty: { fontSize: 16, fontWeight: '700', color: ps.title },
  when: { fontSize: 14, color: ps.primary, fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
