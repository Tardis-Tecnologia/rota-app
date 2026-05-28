import LostAnimalActionMenu from '@/components/animals/LostAnimalActionMenu';
import LostAnimalCard from '@/components/animals/LostAnimalCard';
import LostAnimalMarkFoundModal from '@/components/animals/LostAnimalMarkFoundModal';
import LostAnimalPublishModal from '@/components/animals/LostAnimalPublishModal';
import type { LostAnimalDto } from '@/components/animals/lostAnimalUtils';
import {
    isLostAnimalOwner,
    matchesLostAnimalSearch,
    sortLostAnimals,
    type LostAnimalFormState,
    type PetStatus,
} from '@/components/animals/lostAnimalUtils';
import { forumDisplayHandle } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    createForumComment,
    likeForumPost,
    listForumComments,
    type ForumPostCommentListItemDto,
} from '@/services/forumApi';
import {
    createLostAnimal,
    deleteLostAnimal,
    enrichLostAnimalsMedia,
    listLostAnimals,
    PAGE_SIZE,
    updateLostAnimal,
    updateLostAnimalStatus,
} from '@/services/lostAnimalApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type ListTab = 'lost' | 'found';

function listTabToApiStatus(tab: ListTab): PetStatus {
  return tab === 'found' ? 'FOUND' : 'LOST';
}

export default function LostAnimalsSection() {
  const { user } = useAuth();
  const [items, setItems] = useState<LostAnimalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [imageEpoch, setImageEpoch] = useState(() => Date.now());
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<LostAnimalDto | null>(null);
  const [actionMenuItem, setActionMenuItem] = useState<LostAnimalDto | null>(null);
  const [markFoundConfirmItem, setMarkFoundConfirmItem] = useState<LostAnimalDto | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [commentsByItem, setCommentsByItem] = useState<
    Record<string, ForumPostCommentListItemDto[]>
  >({});
  const [commentDraftByItem, setCommentDraftByItem] = useState<Record<string, string>>({});
  const [commentsExpandedByItem, setCommentsExpandedByItem] = useState<Record<string, boolean>>(
    {},
  );
  const [commentsLoadingByItem, setCommentsLoadingByItem] = useState<Record<string, boolean>>({});
  const [commentSendingItemId, setCommentSendingItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listTab, setListTab] = useState<ListTab>('lost');

  const canInteract = !!user && user.profile !== 'VISITANTE';
  const apiStatus = listTabToApiStatus(listTab);

  const load = useCallback(async (append = false, currentLength = 0) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const init = append ? currentLength : 0;
      const end = init + PAGE_SIZE;
      const listed = await listLostAnimals({ init, end, status: apiStatus });
      const batch = await enrichLostAnimalsMedia(listed);
      setHasMore(batch.length >= PAGE_SIZE);
      setImageEpoch(Date.now());
      if (append) {
        setItems((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const p of batch) {
            if (!ids.has(p.id)) merged.push(p);
          }
          return merged;
        });
      } else {
        setItems(batch);
        setCommentsByItem({});
        setCommentsExpandedByItem({});
        setCommentDraftByItem({});
        setCommentsLoadingByItem({});
      }
    } catch (e) {
      if (!append) setItems([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os animais perdidos.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [apiStatus]);

  useEffect(() => {
    void load(false, 0);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load(false, 0);
  }, [load]);

  const displayItems = useMemo(() => {
    const searched = items.filter((item) => matchesLostAnimalSearch(item, searchQuery));
    return sortLostAnimals(searched, 'recent');
  }, [items, searchQuery]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;
    void load(true, items.length);
  }, [hasMore, load, loading, loadingMore, items.length]);

  const openCreateModal = useCallback(() => {
    setPublishMode('create');
    setEditingItem(null);
    setPublishOpen(true);
  }, []);

  const openEditModal = useCallback((item: LostAnimalDto) => {
    setActionMenuItem(null);
    setPublishMode('edit');
    setEditingItem(item);
    setPublishOpen(true);
  }, []);

  const onFormSubmit = useCallback(
    async (form: LostAnimalFormState, imageUri: string | null) => {
      setPublishing(true);
      setError(null);
      try {
        if (publishMode === 'edit' && editingItem) {
          const updated = await updateLostAnimal(editingItem.id, form, {
            imageUri: imageUri ?? undefined,
            keepMediaId: imageUri ? undefined : editingItem.mediaId,
          });
          setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setPublishOpen(false);
          setEditingItem(null);
        } else {
          if (!imageUri) {
            throw new Error('Selecione uma foto do animal.');
          }
          await createLostAnimal(form, imageUri);
          setPublishOpen(false);
          await load(false, 0);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : publishMode === 'edit'
              ? 'Não foi possível salvar as alterações.'
              : 'Não foi possível publicar.',
        );
      } finally {
        setPublishing(false);
      }
    },
    [editingItem, load, publishMode],
  );

  const onMarkFound = useCallback((item: LostAnimalDto) => {
    setActionMenuItem(null);
    setMarkFoundConfirmItem(item);
  }, []);

  const onConfirmMarkFound = useCallback(async () => {
    const item = markFoundConfirmItem;
    if (!item) return;
    setPublishing(true);
    setError(null);
    try {
      await updateLostAnimalStatus(item.id, 'FOUND');
      setItems((prev) => prev.filter((p) => p.id !== item.id));
      setMarkFoundConfirmItem(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível marcar como encontrado.');
    } finally {
      setPublishing(false);
    }
  }, [markFoundConfirmItem]);

  const onMarkLost = useCallback(
    (item: LostAnimalDto) => {
      setActionMenuItem(null);
      Alert.alert(
        'Voltar para perdido',
        'Reabrir este aviso como animal perdido?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: () => {
              void (async () => {
                setPublishing(true);
                setError(null);
                try {
                  await updateLostAnimalStatus(item.id, 'LOST');
                  setItems((prev) => prev.filter((p) => p.id !== item.id));
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : 'Não foi possível reabrir como perdido.',
                  );
                } finally {
                  setPublishing(false);
                }
              })();
            },
          },
        ],
      );
    },
    [],
  );

  const onDelete = useCallback(
    (item: LostAnimalDto) => {
      setActionMenuItem(null);
      Alert.alert(
        'Apagar publicação',
        'Tem certeza que deseja apagar este avistamento? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Apagar',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setPublishing(true);
                setError(null);
                try {
                  await deleteLostAnimal(item.id);
                  setItems((prev) => prev.filter((p) => p.id !== item.id));
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Não foi possível apagar.');
                } finally {
                  setPublishing(false);
                }
              })();
            },
          },
        ],
      );
    },
    [],
  );

  const onLike = useCallback(
    async (lostAnimalId: string) => {
      const target = items.find((i) => i.id === lostAnimalId);
      const forumPostId = target?.forumPostId?.trim();
      if (!forumPostId) return;

      setItems((prev) =>
        prev.map((p) => {
          if (p.id !== lostAnimalId) return p;
          const wasLiked = !!p.liked;
          return {
            ...p,
            liked: !wasLiked,
            likesCount: Math.max(0, (p.likesCount ?? 0) + (wasLiked ? -1 : 1)),
          };
        }),
      );
      try {
        await likeForumPost(forumPostId);
      } catch {
        void load(false, 0);
      }
    },
    [items, load],
  );

  const loadCommentsForItem = useCallback(
    async (itemId: string, forumPostId: string) => {
      setCommentsLoadingByItem((prev) => ({ ...prev, [itemId]: true }));
      try {
        const comments = await listForumComments(forumPostId, { init: 0, end: 50 });
        setCommentsByItem((prev) => ({ ...prev, [itemId]: comments }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível carregar os comentários.');
      } finally {
        setCommentsLoadingByItem((prev) => ({ ...prev, [itemId]: false }));
      }
    },
    [],
  );

  const onToggleComments = useCallback(
    (item: LostAnimalDto) => {
      const itemId = item.id;
      const willExpand = !commentsExpandedByItem[itemId];
      setCommentsExpandedByItem((prev) => ({ ...prev, [itemId]: willExpand }));
      const forumPostId = item.forumPostId?.trim();
      if (willExpand && forumPostId && !commentsByItem[itemId]) {
        void loadCommentsForItem(itemId, forumPostId);
      }
    },
    [commentsByItem, commentsExpandedByItem, loadCommentsForItem],
  );

  const onSendComment = useCallback(
    async (itemId: string) => {
      const target = items.find((i) => i.id === itemId);
      const forumPostId = target?.forumPostId?.trim();
      const text = (commentDraftByItem[itemId] ?? '').trim();
      if (!text || !user || !forumPostId) return;

      setCommentSendingItemId(itemId);
      try {
        await createForumComment(forumPostId, text);
        setCommentDraftByItem((prev) => ({ ...prev, [itemId]: '' }));
        setItems((prev) =>
          prev.map((p) =>
            p.id === itemId
              ? { ...p, commentsCount: (p.commentsCount ?? 0) + 1 }
              : p,
          ),
        );
        const comments = await listForumComments(forumPostId, { init: 0, end: 50 });
        setCommentsByItem((prev) => ({ ...prev, [itemId]: comments }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível comentar.');
      } finally {
        setCommentSendingItemId(null);
      }
    },
    [commentDraftByItem, items, user],
  );

  const userChip = user ? (
    <View style={styles.userChip}>
      <Text style={styles.userChipText}>
        Você participa como{' '}
        <Text style={styles.userChipBold}>{user.name || 'Morador(a)'}</Text> (
        {forumDisplayHandle({ id: user.id, name: user.name })})
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.wrap}>
      {userChip}

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por espécie, raça, nome..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setListTab('lost')}
          style={[styles.tabBtn, listTab === 'lost' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, listTab === 'lost' && styles.tabBtnTextActive]}>
            Perdidos
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setListTab('found')}
          style={[styles.tabBtn, listTab === 'found' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, listTab === 'found' && styles.tabBtnTextActive]}>
            Encontrados
          </Text>
        </Pressable>
      </View>

      {displayItems.length > 0 || searchQuery.trim() ? (
        <View style={styles.listHeader}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {displayItems.length} aviso{displayItems.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const nearEnd =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
          if (nearEnd) onLoadMore();
        }}
        scrollEventThrottle={200}
      >
        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color="#059669" />
            <Text style={styles.centerText}>Carregando...</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ionicons
              name={listTab === 'found' ? 'checkmark-circle-outline' : 'paw-outline'}
              size={36}
              color={AppColors.text.quaternary}
            />
            <Text style={styles.emptyTitle}>
              {listTab === 'found' ? 'Nenhum animal encontrado' : 'Nenhum animal perdido'}
            </Text>
            <Text style={styles.emptyHint}>
              {listTab === 'found'
                ? 'Animais marcados como encontrados aparecem nesta aba.'
                : 'Seja o primeiro a publicar um avistamento usando o botão abaixo.'}
            </Text>
          </View>
        ) : null}

        {!loading && !error && items.length > 0 && displayItems.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ionicons name="search-outline" size={36} color={AppColors.text.quaternary} />
            <Text style={styles.emptyTitle}>Nenhum resultado</Text>
            <Text style={styles.emptyHint}>Tente outro termo de busca.</Text>
          </View>
        ) : null}

        {!loading
          ? displayItems.map((item) => (
              <LostAnimalCard
                key={item.id}
                item={item}
                imageCacheEpoch={imageEpoch}
                canInteract={canInteract}
                isOwner={isLostAnimalOwner(item, user?.id)}
                comments={commentsByItem[item.id] ?? []}
                commentsExpanded={!!commentsExpandedByItem[item.id]}
                commentDraft={commentDraftByItem[item.id] ?? ''}
                commentSending={commentSendingItemId === item.id}
                commentsLoading={!!commentsLoadingByItem[item.id]}
                onLike={() => void onLike(item.id)}
                onToggleComments={() => onToggleComments(item)}
                onCommentDraftChange={(t) =>
                  setCommentDraftByItem((prev) => ({ ...prev, [item.id]: t }))
                }
                onSendComment={() => void onSendComment(item.id)}
                onOpenActions={() => setActionMenuItem(item)}
              />
            ))
          : null}

        {loadingMore ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color="#059669" size="small" />
          </View>
        ) : null}
      </ScrollView>

      {canInteract ? (
        <TouchableOpacity
          style={styles.publishBtn}
          activeOpacity={0.9}
          onPress={openCreateModal}
        >
          <LinearGradient
            colors={['#059669', '#10b981']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.publishBtnGradient}
          >
            <Ionicons name="add" size={22} color={AppColors.text.white} />
            <Text style={styles.publishBtnText}>Publicar animal perdido</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      <LostAnimalPublishModal
        visible={publishOpen}
        publishing={publishing}
        mode={publishMode}
        editingItem={editingItem}
        onClose={() => {
          setPublishOpen(false);
          setEditingItem(null);
        }}
        onSubmit={(form, uri) => void onFormSubmit(form, uri)}
      />

      <LostAnimalMarkFoundModal
        item={markFoundConfirmItem}
        loading={publishing}
        onClose={() => {
          if (!publishing) setMarkFoundConfirmItem(null);
        }}
        onConfirm={() => void onConfirmMarkFound()}
      />

      <LostAnimalActionMenu
        item={actionMenuItem}
        onClose={() => setActionMenuItem(null)}
        onMarkFound={() => {
          if (actionMenuItem) onMarkFound(actionMenuItem);
        }}
        onMarkLost={() => {
          if (actionMenuItem) onMarkLost(actionMenuItem);
        }}
        onEdit={() => {
          if (actionMenuItem) openEditModal(actionMenuItem);
        }}
        onDelete={() => {
          if (actionMenuItem) onDelete(actionMenuItem);
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 280 },
  sectionHeader: { paddingHorizontal: 4, paddingBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sectionHint: { fontSize: 13, color: AppColors.text.tertiary, marginTop: 4, lineHeight: 18 },
  userChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  userChipText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  userChipBold: { fontWeight: '800', color: '#0f172a' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text.secondary,
    paddingVertical: 0,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#059669',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: '#047857' },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: 100 },
  centerBlock: { paddingVertical: 24, alignItems: 'center', gap: 6 },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600', fontSize: 13 },
  errorBox: {
    marginHorizontal: 4,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  errorText: { color: AppColors.status.error, fontWeight: '700', fontSize: 13 },
  emptyBlock: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: AppColors.text.quaternary,
    textAlign: 'center',
    lineHeight: 18,
  },
  publishBtn: {
    position: 'absolute',
    right: 0,
    bottom: 8,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  publishBtnGradient: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  publishBtnText: { color: AppColors.text.white, fontWeight: '800', fontSize: 14 },
});
