import {
  Badge,
  Card,
  Chip,
  Field,
  InfoRow,
  PrimaryButton,
  ScreenHeader,
  SectionTitle,
  StateView,
  ps,
} from '@/components/publicServices/ui';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleAppointmentReminder } from '@/services/appointmentReminders';
import {
  HEALTH_UNIT_TYPE_LABELS,
  bookAppointment,
  formatSlotDateTime,
  formatTime,
  getAvailableSlots,
  getHealthUnits,
  getReferenceUnit,
  kindLabel,
  localDayKey,
  rescheduleAppointment,
  setReferenceUnit,
  type Appointment,
  type HealthServiceKind,
  type HealthSlot,
  type HealthUnit,
} from '@/services/healthApi';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'unit' | 'specialty' | 'slot' | 'confirm';
const STEPS: Step[] = ['unit', 'specialty', 'slot', 'confirm'];

function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function servicesOf(unit: HealthUnit, kind: HealthServiceKind): string[] {
  return kind === 'EXAM' ? unit.exams : unit.specialties;
}

export default function AgendarScreen() {
  const params = useLocalSearchParams<{
    kind?: string;
    chooseReference?: string;
    rescheduleId?: string;
    unitId?: string;
    specialty?: string;
  }>();
  const kind: HealthServiceKind = params.kind === 'EXAM' ? 'EXAM' : 'CONSULTATION';
  const chooseReference = params.chooseReference === '1';
  const rescheduleId = params.rescheduleId || null;
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(rescheduleId ? 'slot' : 'unit');
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [unit, setUnit] = useState<HealthUnit | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(params.specialty ?? null);

  const [slots, setSlots] = useState<HealthSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<HealthSlot | null>(null);

  const [patientName, setPatientName] = useState(user?.name ?? '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = useCallback(
    (unitId: string, spec: string) => {
      setSlotsLoading(true);
      setSlots([]);
      setDay(null);
      setSlot(null);
      return getAvailableSlots(unitId, { kind, specialty: spec })
        .then(
          (list) => {
            setSlots(list);
            setDay(list.length ? localDayKey(list[0].startsAt) : null);
            setSlotsError(null);
          },
          (e: unknown) => setSlotsError(e instanceof Error ? e.message : 'Erro ao carregar horários'),
        )
        .finally(() => setSlotsLoading(false));
    },
    [kind],
  );

  const fetchUnits = useCallback(
    () =>
      Promise.all([getHealthUnits(), getReferenceUnit().catch(() => null)]).then(
        ([all, ref]) => {
          setUnits(all);
          setReferenceId(ref?.id ?? null);
          setUnitsError(null);
          // Remarcação: a unidade e o serviço já vêm do agendamento atual.
          if (rescheduleId && params.unitId) {
            const current = all.find((u) => u.id === params.unitId) ?? null;
            setUnit(current);
            if (current && params.specialty) void loadSlots(current.id, params.specialty);
          }
        },
        (e: unknown) => setUnitsError(e instanceof Error ? e.message : 'Erro ao carregar'),
      ),
    [rescheduleId, params.unitId, params.specialty, loadSlots],
  );

  const reloadUnits = () => {
    setUnitsLoading(true);
    void fetchUnits().finally(() => setUnitsLoading(false));
  };

  useEffect(() => {
    void fetchUnits().finally(() => setUnitsLoading(false));
  }, [fetchUnits]);

  // Unidades que oferecem o serviço; a UBS de referência vem primeiro.
  const listedUnits = useMemo(() => {
    const base = chooseReference
      ? units.filter((u) => u.type === 'UBS')
      : units.filter((u) => servicesOf(u, kind).length > 0);
    return [...base].sort((a, b) => Number(b.id === referenceId) - Number(a.id === referenceId));
  }, [units, kind, referenceId, chooseReference]);

  const days = useMemo(() => {
    const keys: string[] = [];
    for (const s of slots) {
      const key = localDayKey(s.startsAt);
      if (!keys.includes(key)) keys.push(key);
    }
    return keys;
  }, [slots]);

  const slotsOfDay = useMemo(
    () => (day ? slots.filter((s) => localDayKey(s.startsAt) === day) : []),
    [slots, day],
  );

  const goBack = () => {
    const index = STEPS.indexOf(step);
    if (index === 0 || (rescheduleId && step === 'slot')) router.back();
    else if (step === 'slot' && unit && servicesOf(unit, kind).length === 1) setStep('unit');
    else setStep(STEPS[index - 1]);
  };

  const makeReference = async (u: HealthUnit) => {
    try {
      await setReferenceUnit(u.id);
      setReferenceId(u.id);
      if (chooseReference) {
        Alert.alert('UBS definida', `${u.name} agora é a sua UBS de referência.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : '');
    }
  };

  const chooseUnit = (u: HealthUnit) => {
    if (chooseReference) {
      void makeReference(u);
      return;
    }
    setUnit(u);
    const services = servicesOf(u, kind);
    if (services.length === 1) {
      setSpecialty(services[0]);
      void loadSlots(u.id, services[0]);
      setStep('slot');
    } else {
      setSpecialty(null);
      setStep('specialty');
    }
  };

  const chooseSpecialty = (spec: string) => {
    if (!unit) return;
    setSpecialty(spec);
    void loadSlots(unit.id, spec);
    setStep('slot');
  };

  const afterSaved = async (appointment: Appointment, title: string) => {
    const reminder = await scheduleAppointmentReminder(appointment);
    Alert.alert(
      title,
      `${kindLabel(appointment.kind)}: ${appointment.specialty}\n${appointment.unit.name}\n${formatSlotDateTime(appointment.startsAt)}\n\n` +
        (appointment.kind === 'EXAM'
          ? 'Leve o pedido médico, documento com foto e cartão do SUS.'
          : 'Chegue 15 minutos antes com documento com foto e cartão do SUS.') +
        (reminder ? '\nVocê receberá um lembrete 24h antes.' : ''),
      [{ text: 'Ver meus agendamentos', onPress: () => router.replace('/saude/agendamentos') }],
    );
  };

  const confirm = async () => {
    if (!slot) return;
    setSubmitting(true);
    try {
      if (rescheduleId) {
        const updated = await rescheduleAppointment(rescheduleId, slot.id);
        await afterSaved(updated, 'Atendimento remarcado');
        return;
      }
      if (patientName.trim().length < 3) {
        Alert.alert('Confira os dados', 'Informe o nome de quem será atendido.');
        return;
      }
      const created = await bookAppointment({
        slotId: slot.id,
        patientName: patientName.trim(),
        reason: reason.trim() || undefined,
      });
      await afterSaved(created, kind === 'EXAM' ? 'Exame agendado' : 'Consulta agendada');
    } catch (e) {
      Alert.alert('Não foi possível concluir', e instanceof Error ? e.message : '');
      if (unit && specialty) void loadSlots(unit.id, specialty);
      setStep('slot');
    } finally {
      setSubmitting(false);
    }
  };

  const title = chooseReference
    ? 'Minha UBS de referência'
    : rescheduleId
      ? 'Remarcar'
      : kind === 'EXAM'
        ? 'Agendar exame'
        : 'Agendar consulta';

  const stepTitles: Record<Step, string> = {
    unit: chooseReference ? 'Escolha a UBS que atende você' : 'Escolha a unidade',
    specialty: kind === 'EXAM' ? 'Qual exame?' : 'Qual especialidade?',
    slot: 'Escolha o dia e o horário',
    confirm: rescheduleId ? 'Confirme o novo horário' : 'Confirme o agendamento',
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title={title} onBack={goBack} />

      {!chooseReference && !rescheduleId ? (
        <View style={styles.progress} accessibilityLabel={`Etapa ${stepIndex + 1} de ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.progressBar, i <= stepIndex && styles.progressBarActive]} />
          ))}
        </View>
      ) : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionTitle
            title={stepTitles[step]}
            subtitle={
              step === 'unit' && kind === 'EXAM' && !chooseReference
                ? 'Tenha em mãos o pedido médico. Ele será conferido no dia.'
                : undefined
            }
          />

          {step === 'unit' ? (
            unitsLoading || unitsError || listedUnits.length === 0 ? (
              <StateView
                loading={unitsLoading}
                error={unitsError}
                empty={!unitsLoading && !unitsError && listedUnits.length === 0}
                emptyIcon="calendar-outline"
                emptyTitle={chooseReference ? 'Nenhuma UBS cadastrada' : 'Agendamento ainda indisponível'}
                emptyMessage="Nenhuma unidade abriu agenda pelo aplicativo ainda. Procure sua UBS."
                onRetry={reloadUnits}
              />
            ) : (
              <View style={styles.list}>
                {listedUnits.map((u) => {
                  const isRef = u.id === referenceId;
                  return (
                    <Card
                      key={u.id}
                      onPress={() => chooseUnit(u)}
                      style={[styles.optionCard, isRef && styles.optionCardRef]}
                      accessibilityLabel={`${u.name}${isRef ? ', sua UBS de referência' : ''}`}
                    >
                      <View style={styles.flex}>
                        <View style={styles.optionTop}>
                          <Text style={styles.optionTitle}>{u.name}</Text>
                          {isRef ? <Badge label="Sua UBS" tone="info" /> : null}
                        </View>
                        <Text style={styles.optionSub}>
                          {HEALTH_UNIT_TYPE_LABELS[u.type]}
                          {u.neighborhood ? ` · ${u.neighborhood}` : ''}
                        </Text>
                        {!chooseReference ? (
                          <Text style={styles.optionSub} numberOfLines={2}>
                            {servicesOf(u, kind).join(', ')}
                          </Text>
                        ) : u.address ? (
                          <Text style={styles.optionSub}>{u.address}</Text>
                        ) : null}
                        {!chooseReference && !isRef && u.type === 'UBS' ? (
                          <Pressable
                            onPress={() => void makeReference(u)}
                            hitSlop={6}
                            accessibilityRole="button"
                            style={styles.refLink}
                          >
                            <Text style={styles.refLinkText}>Tornar minha UBS</Text>
                          </Pressable>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </Card>
                  );
                })}
              </View>
            )
          ) : null}

          {step === 'specialty' && unit ? (
            <View style={styles.chips}>
              {servicesOf(unit, kind).map((spec) => (
                <Chip key={spec} label={spec} selected={spec === specialty} onPress={() => chooseSpecialty(spec)} />
              ))}
            </View>
          ) : null}

          {step === 'slot' ? (
            <>
              <Text style={styles.context}>
                {specialty} · {unit?.name ?? ''}
              </Text>
              {slotsLoading || unitsLoading || slotsError || slots.length === 0 ? (
                <StateView
                  loading={slotsLoading || unitsLoading}
                  error={slotsError}
                  empty={!slotsLoading && !unitsLoading && !slotsError && slots.length === 0}
                  emptyIcon="time-outline"
                  emptyTitle="Sem horários livres"
                  emptyMessage="Não há vagas nas próximas 3 semanas. Tente outra unidade ou volte mais tarde."
                  onRetry={() => unit && specialty && void loadSlots(unit.id, specialty)}
                />
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.daysRow}>
                    {days.map((key) => (
                      <Chip key={key} label={dayLabel(key)} selected={key === day} onPress={() => setDay(key)} />
                    ))}
                  </ScrollView>
                  <View style={styles.timeGrid}>
                    {slotsOfDay.map((s) => {
                      const selected = slot?.id === s.id;
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => setSlot(s)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={({ pressed }) => [styles.time, selected && styles.timeSelected, pressed && styles.pressed]}
                        >
                          <Text style={[styles.timeText, selected && styles.timeTextSelected]}>
                            {formatTime(s.startsAt)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {slot?.professionalName ? (
                    <InfoRow icon="person-outline" text={`Profissional: ${slot.professionalName}`} />
                  ) : null}
                  <PrimaryButton label="Continuar" disabled={!slot} onPress={() => setStep('confirm')} />
                </>
              )}
            </>
          ) : null}

          {step === 'confirm' && slot && unit ? (
            <>
              <Card style={styles.summary}>
                <InfoRow icon={kind === 'EXAM' ? 'flask-outline' : 'medical-outline'} text={`${kindLabel(kind)}: ${slot.specialty}`} />
                <InfoRow icon="calendar-outline" text={formatSlotDateTime(slot.startsAt)} />
                <InfoRow icon="business-outline" text={unit.name} />
                {unit.address ? <InfoRow icon="location-outline" text={unit.address} /> : null}
                {slot.professionalName ? <InfoRow icon="person-outline" text={slot.professionalName} /> : null}
              </Card>
              {!rescheduleId ? (
                <>
                  <Field
                    label="Quem será atendido"
                    value={patientName}
                    onChangeText={setPatientName}
                    autoCapitalize="words"
                    hint="Pode ser você ou um dependente."
                  />
                  <Field
                    label={kind === 'EXAM' ? 'Observações (opcional)' : 'Motivo da consulta (opcional)'}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    placeholder={kind === 'EXAM' ? 'Ex.: jejum, pedido do Dr. Fulano' : 'Ex.: dor nas costas há 2 semanas'}
                  />
                </>
              ) : null}
              <PrimaryButton
                label={rescheduleId ? 'Confirmar novo horário' : 'Confirmar agendamento'}
                icon="checkmark-circle-outline"
                loading={submitting}
                onPress={() => void confirm()}
              />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ps.surface },
  flex: { flex: 1 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: ps.surface },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: ps.border },
  progressBarActive: { backgroundColor: ps.primary },
  content: { padding: 16, gap: 14, paddingBottom: 40, backgroundColor: ps.page, flexGrow: 1 },
  list: { gap: 10 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionCardRef: { borderColor: '#93C5FD', backgroundColor: '#F8FBFF' },
  optionTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  optionTitle: { fontSize: 15, fontWeight: '700', color: ps.title, flexShrink: 1 },
  optionSub: { fontSize: 13, color: ps.muted, marginTop: 2 },
  refLink: { marginTop: 6, alignSelf: 'flex-start' },
  refLinkText: { fontSize: 13, fontWeight: '700', color: ps.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hScroll: { flexGrow: 0 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  context: { fontSize: 14, fontWeight: '600', color: ps.body },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: {
    width: '22%',
    flexGrow: 1,
    maxWidth: '24%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: ps.surface,
    alignItems: 'center',
  },
  timeSelected: { backgroundColor: ps.primary, borderColor: ps.primary },
  timeText: { fontSize: 15, fontWeight: '700', color: ps.title },
  timeTextSelected: { color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
  summary: { gap: 8 },
});
