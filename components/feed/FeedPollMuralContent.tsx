import FeedPollCard from '@/components/feed/FeedPollCard';
import { AppColors } from '@/constants/theme';
import { useCanInteractAsCitizen } from '@/hooks/useIsVisitante';
import type { useFeedPollMural } from '@/hooks/useFeedPollMural';
import { createPollVote } from '@/services/pollsApi';
import { getNewsById, newsItemToFeedItem } from '@/services/newsApi';
import type { FeedNovidade } from '@/types/feedNovidade';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MuralState = ReturnType<typeof useFeedPollMural>;

type FeedPollMuralContentProps = {
  mural: MuralState;
};

export default function FeedPollMuralContent({ mural }: FeedPollMuralContentProps) {
  const insets = useSafeAreaInsets();
  const canInteract = useCanInteractAsCitizen();
  const { items, loading, error, refreshing, hasMore, loadingMore, loadInitial, loadMore, refresh, updateItem } =
    mural;

  const [pollVoteSendingId, setPollVoteSendingId] = useState<string | null>(null);
  const [pollVoteErrorById, setPollVoteErrorById] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const ensureCanVote = useCallback((): boolean => {
    if (canInteract) return true;
    promptVisitanteLogin('votar nas enquetes');
    return false;
  }, [canInteract]);

  const onVotePoll = useCallback(
    async (item: FeedNovidade, optionIndex: number) => {
      if (!ensureCanVote()) return;
      const pollId = item.pollId ?? item.poll?.id;
      if (!pollId || !item.poll) return;

      setPollVoteSendingId(item.id);
      setPollVoteErrorById((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      const poll = item.poll;
      const counts = [...poll.optionCounts];
      while (counts.length < poll.options.length) counts.push(0);
      const prevIndex = poll.selectedOptionIndex;
      if (poll.userVoted && prevIndex != null && prevIndex >= 0 && prevIndex < counts.length) {
        counts[prevIndex] = Math.max(0, counts[prevIndex] - 1);
      }
      if (!poll.userVoted || prevIndex !== optionIndex) {
        counts[optionIndex] = (counts[optionIndex] ?? 0) + 1;
      }
      updateItem(item.id, {
        poll: {
          ...poll,
          userVoted: true,
          selectedOptionIndex: optionIndex,
          optionCounts: counts,
        },
      });

      try {
        await createPollVote(pollId, optionIndex, item.hostId ?? undefined);
        const fresh = await getNewsById(item.id);
        if (fresh) updateItem(item.id, newsItemToFeedItem(fresh));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Não foi possível registrar o voto.';
        setPollVoteErrorById((prev) => ({ ...prev, [item.id]: msg }));
        void loadInitial();
      } finally {
        setPollVoteSendingId(null);
      }
    },
    [ensureCanVote, loadInitial, updateItem],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.topTitle}>Mural de enquetes</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Participe das enquetes da prefeitura e acompanhe o que a comunidade está escolhendo.
        </Text>

        {loading && items.length === 0 ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.centerHint}>Carregando enquetes…</Text>
          </View>
        ) : null}

        {error && items.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="alert-circle-outline" size={40} color={AppColors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadInitial()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="stats-chart-outline" size={44} color={AppColors.text.quaternary} />
            <Text style={styles.emptyTitle}>Nenhuma enquete publicada</Text>
            <Text style={styles.emptyHint}>Quando houver enquetes ativas, elas aparecerão aqui.</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <FeedPollCard
            key={item.id}
            item={item}
            canInteract={canInteract}
            voteSubmitting={pollVoteSendingId === item.id}
            voteError={pollVoteErrorById[item.id] ?? null}
            showMuralLink={false}
            onVote={(optionIndex) => void onVotePoll(item, optionIndex)}
          />
        ))}

        {hasMore && items.length > 0 ? (
          <Pressable
            onPress={() => void loadMore()}
            disabled={loadingMore}
            style={({ pressed }) => [styles.loadMoreBtn, pressed && styles.loadMorePressed]}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={AppColors.primary} />
            ) : (
              <Text style={styles.loadMoreText}>Carregar mais enquetes</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8eef4',
  },
  backBtn: {
    padding: 6,
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  topBarSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  centerBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 10,
  },
  centerHint: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.status.error,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loadMorePressed: {
    opacity: 0.7,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
