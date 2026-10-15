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
  type BadgeTone,
} from '@/components/publicServices/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  TELECONSULT_STATUS_LABELS,
  cancelTeleconsult,
  formatSlotDateTime,
  getMyTeleconsults,
  requestTeleconsult,
  type Teleconsult,
  type TeleconsultStatus,
} from '@/services/healthApi';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Sinais de alerta: qualquer "sim" encaminha para atendimento presencial imediato.
 * É uma orientação simples, não um diagnóstico.
 */
const RED_FLAGS = [
  { key: 'chest', text: 'Dor ou aperto no peito, ou falta de ar forte' },
  { key: 'neuro', text: 'Desmaio, convulsão, confusão, fala enrolada ou fraqueza de um lado do corpo' },
  { key: 'bleeding', text: 'Sangramento forte que não para' },
  { key: 'fever', text: 'Febre alta com manchas roxas na pele ou nuca dura' },
  { key: 'pregnancy', text: 'Gestante com sangramento, perda de líquido ou bebê mexendo menos' },
  { key: 'selfharm', text: 'Pensamentos de se machucar ou de tirar a própria vida' },
] as const;

const DURATIONS = ['Hoje', '1 a 3 dias', '4 a 7 dias', 'Mais de 1 semana'];

type Step = 'list' | 'triage' | 'urgent' | 'form';

const statusTone: Record<TeleconsultStatus, BadgeTone> = {
  REQUESTED: 'info',
  SCHEDULED: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
};

export default function TeleconsultaScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('list');
  const [items, setItems] = useState<Teleconsult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [selfHarm, setSelfHarm] = useState(false);
  const [patientName, setPatientName] = useState(user?.name ?? '');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await getMyTeleconsults());
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

  const startTriage = () => {
    setFlags({});
    setSymptoms('');
    setDuration(null);
    setStep('triage');
  };

  const finishTriage = () => {
    const anyFlag = RED_FLAGS.some((f) => flags[f.key]);
    if (anyFlag) {
      setSelfHarm(!!flags.selfharm);
      setStep('urgent');
    } else {
      setStep('form');
    }
  };

  const submit = async () => {
    if (patientName.trim().length < 3) return Alert.alert('Confira', 'Informe o nome de quem será atendido.');
    if (symptoms.trim().length < 10) return Alert.alert('Confira', 'Descreva os sintomas com um pouco mais de detalhe.');
    if (!duration) return Alert.alert('Confira', 'Informe há quanto tempo começaram os sintomas.');
    setSubmitting(true);
    try {
      await requestTeleconsult({
        patientName: patientName.trim(),
        symptoms: `${symptoms.trim()}\n\nInício: ${duration}`,
        triageAnswers: { redFlags: flags, duration },
      });
      Alert.alert(
        'Pedido enviado',
        'A equipe de saúde vai analisar e marcar a teleconsulta. O link da chamada aparece aqui quando for agendada.',
      );
      setStep('list');
      await load(true);
    } catch (e) {
      Alert.alert('Não foi possível enviar', e instanceof Error ? e.message : '');
    } finally {
      setSubmitting(false);
    }
  };

  const join = async (item: Teleconsult) => {
    if (!item.meetingUrl) return;
    try {
      await WebBrowser.openBrowserAsync(item.meetingUrl);
    } catch {
      void Linking.openURL(item.meetingUrl);
    }
  };

  const confirmCancel = (item: Teleconsult) => {
    Alert.alert('Cancelar pedido', 'Deseja cancelar esta teleconsulta?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async () => {
          setBusyId(item.id);
          try {
            await cancelTeleconsult(item.id);
            await load(true);
          } catch (e) {
            Alert.alert('Não foi possível cancelar', e instanceof Error ? e.message : '');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const onBack = () => {
    if (step === 'list') return undefined;
    return () => setStep(step === 'form' || step === 'urgent' ? 'triage' : 'list');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Teleconsulta" onBack={onBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            step === 'list' ? <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} /> : undefined
          }
        >
          {step === 'list' ? (
            <>
              <Card style={styles.hero}>
                <Ionicons name="videocam-outline" size={28} color="#BE185D" />
                <Text style={styles.heroTitle}>Atendimento online para casos simples</Text>
                <Text style={styles.heroText}>
                  Responda uma triagem rápida. Se for seguro atender a distância, a equipe marca uma chamada
                  de vídeo com um profissional da rede municipal.
                </Text>
                <PrimaryButton label="Começar triagem" icon="clipboard-outline" onPress={startTriage} />
              </Card>

              <SectionTitle title="Meus pedidos" />
              {loading || error || items.length === 0 ? (
                <StateView
                  loading={loading}
                  error={error}
                  empty={!loading && !error && items.length === 0}
                  emptyIcon="chatbubbles-outline"
                  emptyTitle="Nenhum pedido ainda"
                  onRetry={() => void load()}
                />
              ) : (
                items.map((item) => (
                  <Card key={item.id} style={styles.card}>
                    <View style={styles.top}>
                      <Text style={styles.patient}>{item.patientName}</Text>
                      <Badge label={TELECONSULT_STATUS_LABELS[item.status]} tone={statusTone[item.status]} />
                    </View>
                    <Text style={styles.symptoms} numberOfLines={3}>
                      {item.symptoms}
                    </Text>
                    {item.status === 'SCHEDULED' && item.scheduledAt ? (
                      <InfoRow icon="calendar-outline" text={formatSlotDateTime(item.scheduledAt)} />
                    ) : null}
                    {item.professionalName ? <InfoRow icon="person-outline" text={item.professionalName} /> : null}
                    {item.status === 'SCHEDULED' && item.meetingUrl ? (
                      <PrimaryButton label="Entrar na chamada" icon="videocam-outline" onPress={() => void join(item)} />
                    ) : null}
                    {item.status === 'REQUESTED' || item.status === 'SCHEDULED' ? (
                      <PrimaryButton
                        label="Cancelar pedido"
                        variant="danger"
                        loading={busyId === item.id}
                        onPress={() => confirmCancel(item)}
                      />
                    ) : null}
                  </Card>
                ))
              )}
            </>
          ) : null}

          {step === 'triage' ? (
            <>
              <SectionTitle
                title="A pessoa tem algum destes sinais agora?"
                subtitle="Marque todos que se aplicam. Se nenhum, toque em continuar."
              />
              {RED_FLAGS.map((f) => {
                const checked = !!flags[f.key];
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFlags((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    style={[styles.flag, checked && styles.flagChecked]}
                  >
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={checked ? ps.danger : '#94A3B8'}
                    />
                    <Text style={styles.flagText}>{f.text}</Text>
                  </Pressable>
                );
              })}
              <PrimaryButton label="Continuar" onPress={finishTriage} />
              <Text style={styles.disclaimer}>
                Esta triagem é só uma orientação e não substitui a avaliação de um profissional de saúde.
              </Text>
            </>
          ) : null}

          {step === 'urgent' ? (
            <Card style={styles.urgent}>
              <Ionicons name="warning" size={32} color={ps.danger} />
              <Text style={styles.urgentTitle}>Procure atendimento presencial agora</Text>
              <Text style={styles.urgentText}>
                Esses sinais precisam de avaliação imediata e não devem esperar uma teleconsulta. Ligue para
                o SAMU ou vá à UPA mais próxima.
              </Text>
              <PrimaryButton label="Ligar para o SAMU (192)" icon="call" onPress={() => void Linking.openURL('tel:192')} />
              {selfHarm ? (
                <PrimaryButton
                  label="Conversar com o CVV (188)"
                  variant="outline"
                  icon="heart-outline"
                  onPress={() => void Linking.openURL('tel:188')}
                />
              ) : null}
            </Card>
          ) : null}

          {step === 'form' ? (
            <>
              <SectionTitle
                title="Conte o que está sentindo"
                subtitle="Essas informações vão para a equipe que fará o atendimento."
              />
              <Field label="Quem será atendido" value={patientName} onChangeText={setPatientName} autoCapitalize="words" />
              <Field
                label="Sintomas"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                placeholder="Ex.: tosse e dor de garganta, sem febre"
              />
              <Text style={styles.label}>Desde quando?</Text>
              <View style={styles.chips}>
                {DURATIONS.map((d) => (
                  <Chip key={d} label={d} selected={duration === d} onPress={() => setDuration(d)} />
                ))}
              </View>
              <PrimaryButton label="Pedir teleconsulta" icon="send-outline" loading={submitting} onPress={() => void submit()} />
              <Text style={styles.disclaimer}>
                Se os sintomas piorarem enquanto espera, procure a UPA ou ligue 192.
              </Text>
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
  content: { padding: 16, gap: 14, paddingBottom: 40, backgroundColor: ps.page, flexGrow: 1 },
  hero: { gap: 10, borderColor: '#FBCFE8', backgroundColor: '#FFF7FB' },
  heroTitle: { fontSize: 17, fontWeight: '800', color: ps.title },
  heroText: { fontSize: 14, color: ps.body, lineHeight: 20 },
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  patient: { flex: 1, fontSize: 16, fontWeight: '700', color: ps.title },
  symptoms: { fontSize: 14, color: ps.body, lineHeight: 20 },
  flag: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ps.border,
    backgroundColor: ps.surface,
  },
  flagChecked: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  flagText: { flex: 1, fontSize: 14, color: ps.title, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: ps.muted, textAlign: 'center', lineHeight: 17 },
  urgent: { gap: 12, alignItems: 'stretch', borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  urgentTitle: { fontSize: 18, fontWeight: '800', color: '#991B1B' },
  urgentText: { fontSize: 14, color: '#7F1D1D', lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: ps.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
