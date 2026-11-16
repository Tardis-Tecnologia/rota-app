import { AppColors } from '@/constants/theme';
import type { FeedNovidade } from '@/types/feedNovidade';
import {
  feedPublisherDisplayName,
  formatPublisherHandleLine,
  isSuperadminPublisherProfile,
} from '@/utils/feedPublisher';
import { pollOptionIconName } from '@/utils/pollOptionIcons';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface FeedPollCardProps {
  item: FeedNovidade;
  canInteract: boolean;
  voteSubmitting: boolean;
  voteError: string | null;
  onVote: (optionIndex: number) => void;
  /** Na tela de detalhe, só bloco de opções. */
  embedded?: boolean;
  /** Link inferior do card no feed. */
  showMuralLink?: boolean;
  onOpenMural?: () => void;
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
}

const DEFAULT_SUBTITLE = 'Sua opinião ajuda a prefeitura a decidir';

function formatVotesLine(totalVotes: number): string {
  if (totalVotes <= 0) return 'Seja o primeiro a votar';
  if (totalVotes === 1) return '1 voto';
  return `${totalVotes} votos`;
}

export default function FeedPollCard({
  item,
  canInteract,
  voteSubmitting,
  voteError,
  onVote,
  embedded = false,
  showMuralLink = true,
  onOpenMural,
  style,
  showDivider = true,
}: FeedPollCardProps) {
  const poll = item.poll;
  const options = poll?.options ?? [];
  const counts = poll?.optionCounts ?? [];
  const totalVotes = counts.reduce((sum, n) => sum + Math.max(0, n), 0);
  const selectedIndex = poll?.userVoted ? poll.selectedOptionIndex : null;
  const showResults = totalVotes > 0;

  const publisherName = useMemo(() => feedPublisherDisplayName(item), [item]);
  const isSuperadmin = useMemo(
    () => isSuperadminPublisherProfile(item.autorPerfil, item.autorHandle),
    [item.autorPerfil, item.autorHandle],
  );

  const subtitle = useMemo(() => {
    const t = item.resumo?.trim();
    if (!t || t === item.titulo?.trim()) return DEFAULT_SUBTITLE;
    return t;
  }, [item.resumo, item.titulo]);

  const openMural = () => {
    if (onOpenMural) {
      onOpenMural();
      return;
    }
    router.push('/enquetes');
  };

  const optionsBlock = (
    <View style={styles.optionsList}>
      {options.length === 0 ? (
        <Text style={styles.emptyOptions}>Opções indisponíveis nesta enquete.</Text>
      ) : (
        options.map((label, index) => {
          const count = counts[index] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = selectedIndex === index;
          const iconName = pollOptionIconName(index);
          return (
            <Pressable
              key={`${index}-${label}`}
              onPress={() => onVote(index)}
              disabled={!canInteract || voteSubmitting || !poll}
              style={({ pressed }) => [
                styles.optionButton,
                isSelected ? styles.optionButtonSelected : styles.optionButtonIdle,
                (!canInteract || voteSubmitting) && styles.optionDisabled,
                pressed && canInteract && !voteSubmitting && styles.optionButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Votar em ${label}`}
            >
              <View style={styles.optionIconBox}>
                <Ionicons name={iconName} size={18} color={AppColors.primary} />
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionLabelRow}>
                  <Text
                    style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                    numberOfLines={2}
                  >
                    {label}
                  </Text>
                  {showResults ? <Text style={styles.optionPct}>{pct}%</Text> : null}
                </View>
                {showResults ? (
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(pct, isSelected ? 6 : 2)}%`,
                          backgroundColor: isSelected ? AppColors.primaryDark : AppColors.primary,
                        },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}

      {poll?.userVoted ? (
        <Text style={styles.votedHint}>Voto registrado. Toque em outra opção para alterar.</Text>
      ) : null}

      {voteSubmitting ? (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.sendingText}>Registrando voto…</Text>
        </View>
      ) : null}
      {voteError ? <Text style={styles.voteError}>{voteError}</Text> : null}
    </View>
  );

  if (embedded) {
    return <View style={[styles.embeddedWrap, style]}>{optionsBlock}</View>;
  }

  return (
    <View style={[styles.card, showDivider && styles.cardDivider, style]}>
      <View style={styles.header}>
        <Image source={{ uri: item.autorAvatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName} numberOfLines={1}>
              {publisherName}
            </Text>
            {item.isOfficial || isSuperadmin ? (
              <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" />
            ) : null}
          </View>
          <Text style={styles.metaLine} numberOfLines={1}>
            {item.isOfficial && (item.officialRole || item.officialInstitution)
              ? `${[item.officialRole, item.officialInstitution].filter(Boolean).join(' · ')} · ${item.dataRelativa.replace(/^há\s+/i, '').trim() || item.dataRelativa}`
              : formatPublisherHandleLine(item.autorHandle, item.dataRelativa)}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.pollTypeRow}>
          <Ionicons name="stats-chart" size={15} color={AppColors.primary} />
          <Text style={styles.badgeText}>ENQUETE</Text>
        </View>

        <Text style={styles.question}>{item.titulo}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {optionsBlock}

        <Text style={styles.statsLine}>{formatVotesLine(totalVotes)}</Text>

        {showMuralLink ? (
          <>
            <View style={styles.footerDivider} />
            <Pressable
              onPress={openMural}
              style={({ pressed }) => [styles.muralLink, pressed && styles.muralLinkPressed]}
              accessibilityRole="link"
              accessibilityLabel="Acessar mural de enquetes"
            >
              <Text style={styles.muralLinkText}>acessar mural de enquetes</Text>
              <Ionicons name="chevron-forward" size={18} color={AppColors.primary} />
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  embeddedWrap: {
    gap: 12,
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingBottom: 4,
  },
  cardDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flexShrink: 1,
  },
  metaLine: {
    fontSize: 12,
    color: '#64748b',
  },
  body: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  pollTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: AppColors.primary,
  },
  question: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginBottom: 12,
  },
  optionsList: {
    gap: 10,
    marginBottom: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  optionButtonIdle: {
    backgroundColor: '#f8fafc',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  optionButtonSelected: {
    backgroundColor: '#fafbfc',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#93c5fd',
  },
  optionButtonPressed: {
    backgroundColor: '#f1f5f9',
  },
  optionDisabled: {
    opacity: 0.55,
  },
  optionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },
  optionLabelSelected: {
    color: AppColors.primary,
    fontWeight: '800',
  },
  optionPct: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyOptions: {
    fontSize: 13,
    color: '#64748b',
  },
  votedHint: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendingText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  voteError: {
    fontSize: 12,
    color: AppColors.status.error,
    fontWeight: '600',
  },
  statsLine: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
    marginTop: 10,
    marginBottom: 2,
  },
  muralLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  muralLinkPressed: {
    opacity: 0.75,
  },
  muralLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
