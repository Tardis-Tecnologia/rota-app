import { AppColors } from '@/constants/theme';
import {
  COURSE_MODALITY_LABEL,
  COURSE_STATUS_LABEL,
  COURSE_STATUS_TONE,
  cancelCourseEnrollment,
  getCourseEnrollment,
  type CourseEnrollment,
} from '@/services/educationApi';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const NOTICE_KIND_META: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  ACCESS: { label: 'Acesso', color: '#0369A1', bg: '#E0F2FE', icon: 'key-outline' },
  PENDING: { label: 'Pendência', color: '#B45309', bg: '#FEF3C7', icon: 'alert-circle-outline' },
  ALERT: { label: 'Alerta', color: '#B91C1C', bg: '#FEE2E2', icon: 'warning-outline' },
  INFO: { label: 'Aviso', color: '#1D4ED8', bg: '#DBEAFE', icon: 'notifications-outline' },
};

export default function CourseEnrollmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setItem(await getCourseEnrollment(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar inscrição');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const accepted = useMemo(
    () => item?.status === 'CONFIRMED' || item?.status === 'COMPLETED',
    [item?.status],
  );

  const onCancel = () => {
    if (!item) return;
    Alert.alert('Cancelar inscrição', 'Deseja cancelar esta inscrição?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            setItem(await cancelCourseEnrollment(item.id));
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao cancelar');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={AppColors.primary} />;
  }
  if (error || !item) {
    return <Text style={styles.error}>{error || 'Inscrição não encontrada'}</Text>;
  }

  return (
    <>
      <Stack.Screen options={{ title: item.protocol }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.headerStatusPill,
              { backgroundColor: COURSE_STATUS_TONE[item.status].bg },
            ]}
          >
            <Text
              style={[
                styles.headerStatusText,
                { color: COURSE_STATUS_TONE[item.status].text },
              ]}
            >
              {COURSE_STATUS_LABEL[item.status]}
            </Text>
          </View>
          <Text style={styles.title}>{item.courseTitle}</Text>
          <Text style={styles.meta}>
            Protocolo {item.protocol}
            {item.className ? ` · ${item.className}` : ''}
            {item.modality ? ` · ${COURSE_MODALITY_LABEL[item.modality]}` : ''}
          </Text>
          <Text style={styles.meta}>
            Inscrito em {new Date(item.createdAt).toLocaleString('pt-BR')}
          </Text>
        </View>

        {item.status === 'CONFIRMED' || item.status === 'REJECTED' || item.statusReason ? (
          <View
            style={[
              styles.card,
              item.status === 'CONFIRMED' && styles.decisionApproved,
              item.status === 'REJECTED' && styles.decisionRejected,
              (item.status === 'RECEIVED' || item.status === 'IN_REVIEW') && styles.decisionReview,
            ]}
          >
            <Text style={styles.cardTitle}>
              {item.status === 'CONFIRMED'
                ? 'Inscrição aprovada'
                : item.status === 'REJECTED'
                  ? 'Inscrição reprovada'
                  : 'Situação da inscrição'}
            </Text>
            <Text style={styles.cardBody}>
              {item.statusReason ||
                (item.status === 'CONFIRMED'
                  ? 'Sua inscrição foi aprovada pela prefeitura.'
                  : item.status === 'REJECTED'
                    ? 'Sua inscrição foi reprovada. Aguarde o motivo ou fale com a secretaria.'
                    : 'Sua inscrição está em análise. Você será avisado quando houver decisão.')}
            </Text>
          </View>
        ) : null}

        {item.nextSteps ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Próximos passos</Text>
            <Text style={styles.cardBody}>{item.nextSteps}</Text>
          </View>
        ) : null}

        {accepted ? (
          <View style={[styles.card, styles.noticesCard]}>
            <View style={styles.noticesHeader}>
              <Ionicons name="notifications" size={18} color="#1D4ED8" />
              <Text style={styles.cardTitle}>Avisos e comunicações do curso</Text>
            </View>
            <Text style={styles.cardBody}>
              Depois da matrícula aceita, a prefeitura envia por aqui o acesso, pendências e
              orientações deste curso.
            </Text>

            {item.accessInfo ? (
              <View style={styles.accessBox}>
                <Text style={styles.accessTitle}>Como acessar</Text>
                <Text style={styles.cardBody}>{item.accessInfo}</Text>
              </View>
            ) : null}

            {(item.notices ?? []).length ? (
              (item.notices ?? []).map((notice) => {
                const meta = NOTICE_KIND_META[notice.kind] || NOTICE_KIND_META.INFO;
                return (
                  <View key={notice.id} style={[styles.noticeItem, { backgroundColor: meta.bg }]}>
                    <View style={styles.noticeTop}>
                      <Ionicons name={meta.icon} size={16} color={meta.color} />
                      <Text style={[styles.noticeKind, { color: meta.color }]}>{meta.label}</Text>
                      <Text style={styles.noticeDate}>
                        {new Date(notice.createdAt).toLocaleString('pt-BR')}
                      </Text>
                    </View>
                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                    <Text style={styles.cardBody}>{notice.body}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.hintEmpty}>
                Ainda não há avisos novos. Volte depois — as notificações deste curso aparecem
                nesta área.
              </Text>
            )}
          </View>
        ) : null}

        {item.orientation && !accepted ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Orientações</Text>
            <Text style={styles.cardBody}>{item.orientation}</Text>
          </View>
        ) : null}

        {item.pendingDocuments?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pendências</Text>
            {item.pendingDocuments.map((doc) => (
              <Text key={doc} style={styles.cardBody}>
                • {doc}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados do curso</Text>
          <Text style={styles.cardBody}>{item.institution || 'Instituição municipal'}</Text>
          <Text style={styles.cardBody}>
            Turma: {item.className || '—'}
            {item.classShift ? ` · ${item.classShift}` : ''}
          </Text>
          {item.applicantName ? (
            <Text style={styles.cardBody}>Candidato: {item.applicantName}</Text>
          ) : null}
          <Pressable
            onPress={() => router.push(`/education/cursos/${item.courseId}` as Href)}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>Ver curso</Text>
            <Ionicons name="chevron-forward" size={16} color={AppColors.primary} />
          </Pressable>
        </View>

        {item.documents?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Documentação enviada</Text>
            {item.documents.map((doc) => (
              <Pressable
                key={doc.id}
                onPress={() => void Linking.openURL(doc.url)}
                style={styles.docRow}
              >
                <Ionicons name="document-attach-outline" size={18} color={AppColors.primary} />
                <Text style={styles.docText}>
                  {doc.name}
                  {doc.kind ? ` (${doc.kind})` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Histórico</Text>
          {(item.events ?? []).map((ev) => (
            <View key={ev.id} style={styles.event}>
              <Text style={styles.eventStatus}>{COURSE_STATUS_LABEL[ev.status]}</Text>
              <Text style={styles.eventMeta}>
                {new Date(ev.createdAt).toLocaleString('pt-BR')}
              </Text>
              {ev.message ? <Text style={styles.cardBody}>{ev.message}</Text> : null}
            </View>
          ))}
          {!item.events?.length ? (
            <Text style={styles.cardBody}>Sem movimentações registradas.</Text>
          ) : null}
        </View>

        {item.cancelAllowed &&
        ['RECEIVED', 'IN_REVIEW', 'AWAITING_DOCS', 'WAITLIST'].includes(item.status) ? (
          <Pressable
            style={[styles.cancelBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancelar inscrição</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  header: {
    backgroundColor: AppColors.primary,
    borderRadius: 18,
    padding: 16,
  },
  headerStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerStatusText: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  title: { marginTop: 10, fontSize: 22, fontWeight: '800', color: '#fff' },
  meta: { marginTop: 4, color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  decisionApproved: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  decisionRejected: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  decisionReview: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  noticesCard: { borderColor: '#BFDBFE', backgroundColor: '#F8FBFF' },
  noticesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cardBody: { fontSize: 14, lineHeight: 20, color: AppColors.text.tertiary },
  accessBox: {
    marginTop: 10,
    marginBottom: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#A7F3D0',
  },
  accessTitle: { fontWeight: '800', color: '#047857', marginBottom: 4 },
  noticeItem: { marginTop: 10, borderRadius: 12, padding: 12 },
  noticeTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  noticeKind: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  noticeDate: { marginLeft: 'auto', fontSize: 11, color: AppColors.text.quaternary },
  noticeTitle: { fontWeight: '800', color: AppColors.text.secondary, marginBottom: 2 },
  hintEmpty: { marginTop: 8, fontSize: 13, color: AppColors.text.quaternary, lineHeight: 18 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  linkText: { color: AppColors.primary, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  docText: { color: AppColors.text.secondary, fontWeight: '600', flex: 1 },
  event: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  eventStatus: { fontWeight: '800', color: AppColors.text.secondary },
  eventMeta: { fontSize: 12, color: AppColors.text.quaternary, marginTop: 2 },
  cancelBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
  },
  cancelText: { color: '#b91c1c', fontWeight: '800' },
  disabled: { opacity: 0.6 },
  error: { margin: 16, color: '#b91c1c' },
});
