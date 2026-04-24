import CpfRequiredModal from '@/components/CpfRequiredModal';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors, hexToRgba, resolvePollAccentColor } from '@/constants/theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { PollDto } from '@/services/pollsApi';
import {
    buildVoteRewardToastMessage,
    createPollVote,
    getLatestPollForHost,
    listPollVotesForUserPoll,
} from '@/services/pollsApi';
import { notifyRewardPointsChanged } from '@/services/rewardPointsBridge';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

function labelFromOptionEntry(x: unknown): string {
  if (x == null) return '';
  if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') {
    return String(x).trim();
  }
  if (typeof x === 'object' && !Array.isArray(x)) {
    const o = x as Record<string, unknown>;
    const cand = o.text ?? o.label ?? o.title ?? o.name ?? o.value;
    if (typeof cand === 'string' || typeof cand === 'number') {
      return String(cand).trim();
    }
  }
  const s = String(x).trim();
  return s === '[object Object]' ? '' : s;
}

function parsePollOptions(raw: unknown): string[] {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      value = JSON.parse(t) as unknown;
    } catch {
      return [t];
    }
  }
  if (Array.isArray(value)) {
    return value.map(labelFromOptionEntry).filter((s) => s.length > 0);
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['options', 'items', 'choices', 'labels'] as const) {
      const inner = o[key];
      if (Array.isArray(inner)) {
        return inner.map(labelFromOptionEntry).filter((s) => s.length > 0);
      }
    }
  }
  return [];
}

interface OpinionCardProps {
  hostId?: string;
  onVoteSuccess?: (message: string) => void;
}

export default function OpinionCard({ hostId, onVoteSuccess }: OpinionCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { backgroundColor: themeBgForAccent } = useAppTheme();
  const accentColor = useMemo(
    () => resolvePollAccentColor(themeBgForAccent),
    [themeBgForAccent],
  );
  const [poll, setPoll] = useState<PollDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  /** Já existe registro em poll_votes (carregado da API ou após o 1º voto nesta sessão). */
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  /** Evita votar antes do GET de poll-votes (sem isso o 1º voto poderia resgatar pontos de novo). */
  const [voteLookupDone, setVoteLookupDone] = useState(false);
  const [showCpfModal, setShowCpfModal] = useState(false);

  const cpfKnown = Boolean(user && user.cpf !== undefined);
  const hasValidCpf = Boolean(user?.cpf && user.cpf.replace(/\D/g, '').length === 11);
  const canVote = cpfKnown && hasValidCpf;

  const loadPoll = useCallback(async (): Promise<void> => {
    if (!user) {
      setPoll(null);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const latest = await getLatestPollForHost(hostId);
      setPoll(latest);
    } catch (e) {
      setPoll(null);
      setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar a enquete.');
    } finally {
      setLoading(false);
    }
  }, [user, hostId]);

  useEffect(() => {
    if (!isFocused || !user) {
      return;
    }
    void loadPoll();
  }, [isFocused, user, hostId, loadPoll]);

  useEffect(() => {
    setAlreadyVoted(false);
    setVoteLookupDone(false);
    setSelectedIndex(null);
    setVoteError(null);
    setShowCpfModal(false);
  }, [poll?.id]);

  useEffect(() => {
    if (!poll || !user?.id || !isFocused) {
      return;
    }
    let cancelled = false;
    setVoteLookupDone(false);
    void (async () => {
      try {
        const rows = await listPollVotesForUserPoll(poll.id, user.id, hostId);
        if (!cancelled) {
          setAlreadyVoted(rows.length > 0);
        }
      } catch {
        if (!cancelled) {
          setAlreadyVoted(false);
        }
      } finally {
        if (!cancelled) {
          setVoteLookupDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poll?.id, user?.id, hostId, isFocused]);

  const options = poll ? parsePollOptions(poll.options) : [];

  const handleOptionPress = async (index: number): Promise<void> => {
    if (!poll || submitting || !user) return;
    if (!canVote || !voteLookupDone) return;
    const shouldRedeem = !alreadyVoted;
    setSelectedIndex(index);
    setVoteError(null);
    setSubmitting(true);
    let voteRecorded = false;
    try {
      await createPollVote(poll.id, hostId);
      voteRecorded = true;
      setAlreadyVoted(true);
      const toastMessage = await buildVoteRewardToastMessage(poll.id, hostId, {
        redeem: shouldRedeem,
      });
      onVoteSuccess?.(toastMessage);
    } catch (e) {
      setSelectedIndex(null);
      setVoteError(e instanceof Error ? e.message : 'Não foi possível registrar sua participação.');
    } finally {
      if (voteRecorded && shouldRedeem) {
        notifyRewardPointsChanged();
      }
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={[styles.pollCard, styles.loadingCard]}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.loadingText}>Carregando enquete...</Text>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.section}>
        <View style={[styles.pollCard, styles.errorCard]}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </View>
    );
  }

  if (!poll) {
    return null;
  }

  const optionBgIdle = hexToRgba(accentColor, 0.1);
  const optionBorderIdle = hexToRgba(accentColor, 0.28);

  return (
    <View style={styles.section}>
      <View style={styles.pollShell}>
        <View style={styles.pollCard}>
          <View
            style={styles.cardInner}
            collapsable={Platform.OS === 'android' ? false : undefined}
          >
            <View style={styles.header}>
              <Ionicons name="stats-chart" size={20} color={AppColors.primary} />
              <Text style={styles.headerText}>Sua opinião importa!</Text>
            </View>

            <Text style={styles.question}>{poll.name}</Text>
            {poll.description ? (
              <Text style={styles.description} numberOfLines={4}>
                {poll.description}
              </Text>
            ) : null}

            {alreadyVoted ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color={AppColors.status.success} />
                <Text style={styles.successText}>
                  Participação registrada. Toque em outra opção para alterar.
                </Text>
              </View>
            ) : null}

            {!canVote ? (
              <View style={styles.cpfGateBox}>
                <Ionicons name="alert-circle" size={22} color={AppColors.status.warning} />
                <View style={styles.cpfGateContent}>
                  {cpfKnown ? (
                    <>
                      <Text style={styles.cpfGateTitle}>CPF obrigatório para votar</Text>
                      <Text style={styles.cpfGateText}>
                        Para participar da enquete e resgatar pontos é necessário informar um CPF válido no cadastro.
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowCpfModal(true)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel="Abrir orientação para cadastrar CPF"
                      >
                        <Text style={styles.cpfGateLink}>Cadastrar CPF</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.cpfGateText}>Verificando seu cadastro…</Text>
                  )}
                </View>
              </View>
            ) : null}

            {options.length === 0 ? (
              <View style={styles.emptyOptionsBox}>
                <Text style={styles.emptyOptionsTitle}>Opções indisponíveis</Text>
                <Text style={styles.emptyOptionsText}>
                  Esta enquete não retornou opções no formato esperado. Tente atualizar a tela ou entre em contato com o
                  suporte.
                </Text>
              </View>
            ) : null}

            <View style={styles.optionsList}>
              {options.map((label, index) => {
                const isSelected = selectedIndex === index;
                const disabled = submitting || !canVote || !voteLookupDone;
                return (
                  <TouchableOpacity
                    key={`${index}-${label}`}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: isSelected ? AppColors.background.default : optionBgIdle,
                        borderColor: isSelected ? accentColor : optionBorderIdle,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: disabled && !isSelected ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => void handleOptionPress(index)}
                    activeOpacity={0.75}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={`Opção: ${label}`}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        isSelected ? { color: accentColor, fontWeight: '700' } : styles.optionButtonTextIdle,
                      ]}
                      numberOfLines={4}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {submitting ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={AppColors.primary} />
                <Text style={styles.inlineLoadingText}>Enviando...</Text>
              </View>
            ) : null}
            {voteError ? <Text style={styles.voteErrorText}>{voteError}</Text> : null}
          </View>
        </View>
        <VisitanteLoginOverlay message="Para votar nas enquetes e acumular pontos, faça login com uma conta cadastrada." />
      </View>
      <CpfRequiredModal
        visible={showCpfModal}
        onClose={() => setShowCpfModal(false)}
        onCompleteProfile={() => {
          setShowCpfModal(false);
          router.push('/edit-account');
        }}
        title="CPF necessário para votar"
        message="Informe um CPF válido no seu perfil para participar da enquete e receber os pontos da recompensa."
      />
    </View>
  );
}

// pollShell: overlay fora do cartão com position relative no shell (evita clip no Android).
const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  pollShell: {
    position: 'relative',
  },
  pollCard: {
    borderRadius: 20,
  },
  loadingCard: {
    backgroundColor: AppColors.background.default,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  errorCard: {
    backgroundColor: AppColors.background.default,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 20,
  },
  errorText: {
    fontSize: 13,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  emptyOptionsBox: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  emptyOptionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginBottom: 6,
  },
  emptyOptionsText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 19,
  },
  cpfGateBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  cpfGateContent: {
    flex: 1,
  },
  cpfGateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  cpfGateText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 19,
  },
  cpfGateLink: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
  cardInner: {
    backgroundColor: AppColors.background.default,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 20,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    marginBottom: 14,
    lineHeight: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionButtonTextIdle: {
    color: AppColors.text.secondary,
    fontWeight: '600',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  inlineLoadingText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  voteErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#f87171',
  },
});
