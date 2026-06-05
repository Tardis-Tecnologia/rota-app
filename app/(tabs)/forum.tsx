import FilterTabs, { type FilterOption } from '@/components/FilterTabs';
import ForumAllPostsSection from '@/components/forum/ForumAllPostsSection';
import ForumCommunitySection from '@/components/forum/ForumCommunitySection';
import ForumPublishFab from '@/components/forum/ForumPublishFab';
import { AppColors } from '@/constants/theme';
import { useForumModeration } from '@/contexts/ForumModerationContext';
import { useCanInteractAsCitizen } from '@/hooks/useIsVisitante';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import {
  createForumPost,
  findRecentlyCreatedForumPostId,
  updateForumPost,
  uploadForumImageFromUri,
} from '@/services/forumApi';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const FILTERS: FilterOption[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'community', label: 'Comunidade' },
  // { key: 'lost_animal', label: 'Perdidos' },
];

export default function ForumScreen() {
  const canInteract = useCanInteractAsCitizen();
  const { handleForumApiError, refreshRestrictionsIfStale } = useForumModeration();

  useFocusEffect(
    useCallback(() => {
      void refreshRestrictionsIfStale();
    }, [refreshRestrictionsIfStale]),
  );
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const isCommunityHub = activeFilter === 'community';
  const isAllPosts = activeFilter === 'todos';
  const [refreshing, setRefreshing] = useState(false);
  const [allFeedReloadToken, setAllFeedReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const onPublish = useCallback(async () => {
    if (!canInteract) {
      promptVisitanteLogin('publicar no fórum');
      return;
    }
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        postType: 'community' as const,
      };
      await createForumPost(undefined, payload);
      if (imageUri) {
        const createdPostId = await findRecentlyCreatedForumPostId(payload);
        if (!createdPostId) {
          throw new Error(
            'Publicação criada, mas não foi possível localizar o post para anexar a foto.',
          );
        }
        const up = await uploadForumImageFromUri(imageUri);
        await updateForumPost(createdPostId, { mediaId: up.id });
      }
      setPublishOpen(false);
      setTitle('');
      setContent('');
      setImageUri(null);
      setAllFeedReloadToken((t) => t + 1);
    } catch (e) {
      if (await handleForumApiError(e)) return;
      setError(e instanceof Error ? e.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }, [canInteract, content, handleForumApiError, imageUri, title]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const canPublish = useMemo(
    () => title.trim().length > 0 && content.trim().length > 0 && !publishing,
    [content, publishing, title],
  );

  const startRefresh = useCallback(() => setRefreshing(true), []);
  const endRefresh = useCallback(() => setRefreshing(false), []);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <FilterTabs
          filters={FILTERS}
          active={activeFilter}
          onSelect={(f) => setActiveFilter(f)}
          compact
          containerStyle={{ paddingBottom: 0 }}
        />
      </View>

      <View style={styles.content}>
        <View style={[styles.filterPanel, !isAllPosts && styles.filterPanelHidden]}>
          <ForumAllPostsSection
            refreshing={refreshing}
            onRefresh={startRefresh}
            onRefreshComplete={endRefresh}
            reloadToken={allFeedReloadToken}
          />
        </View>
        <View style={[styles.filterPanel, !isCommunityHub && styles.filterPanelHidden]}>
          <ForumCommunitySection
            refreshing={refreshing}
            onRefresh={startRefresh}
            onRefreshComplete={endRefresh}
          />
        </View>
      </View>

      {isAllPosts && canInteract ? (
        <ForumPublishFab onOpenPublish={() => setPublishOpen(true)} />
      ) : null}

      {error ? (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>{error}</Text>
        </View>
      ) : null}

      <Modal
        visible={publishOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPublishOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova publicação</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={title}
              onChangeText={setTitle}
              maxLength={255}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Sua mensagem..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={20000}
            />
            <Pressable style={styles.photoPickBtn} onPress={() => void pickImage()}>
              <Ionicons name="image-outline" size={18} color={AppColors.text.secondary} />
              <Text style={styles.photoPickText}>
                {imageUri ? 'Trocar foto' : 'Selecionar foto'}
              </Text>
            </Pressable>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.photoPreview} /> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPublishOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => void onPublish()}
                disabled={!canPublish}
                style={[styles.confirmBtn, !canPublish && styles.confirmBtnDisabled]}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color={AppColors.text.white} />
                ) : (
                  <Text style={styles.confirmText}>Publicar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topSection: { paddingTop: 6, paddingBottom: 0 },
  content: { flex: 1, minHeight: 0 },
  filterPanel: { flex: 1, minHeight: 0 },
  filterPanelHidden: { display: 'none' },
  errorToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 80,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.95)',
  },
  errorToastText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: AppColors.text.secondary },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: AppColors.text.secondary,
    backgroundColor: AppColors.background.default,
  },
  photoPickBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPickText: {
    color: AppColors.text.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: AppColors.background.muted,
  },
  textarea: { minHeight: 96 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelText: { color: AppColors.text.tertiary, fontWeight: '700', fontSize: 16 },
  confirmBtn: {
    backgroundColor: AppColors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 96,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmText: { color: AppColors.text.white, fontWeight: '800', fontSize: 16 },
});
