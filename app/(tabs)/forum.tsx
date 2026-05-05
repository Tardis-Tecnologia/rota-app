import FilterTabs, { type FilterOption } from '@/components/FilterTabs';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getApiBaseUrl } from '@/services/authApi';
import {
  createForumPost,
  findRecentlyCreatedForumPostId,
  getForumPost,
  likeForumPost,
  listForumPosts,
  updateForumPost,
  uploadForumImageFromUri,
  type ForumPostResponseDto,
} from '@/services/forumApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const FILTERS: FilterOption[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'community', label: 'Comunidade' },
  { key: 'lost_animal', label: 'Perdidos' },
];

function formatTimeAgo(value: string): string {
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `Há ${diffD} d`;
}

function forumPostImageUrl(mediaId: string | null): string | null {
  if (!mediaId) return null;
  return `${getApiBaseUrl()}/api/v1/upload/files/${encodeURIComponent(mediaId)}`;
}

export default function ForumScreen() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ForumPostResponseDto[]>([]);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const postType = activeFilter === 'todos' ? undefined : activeFilter;
        const rows = await listForumPosts(undefined, {
          postType,
          init: 0,
          end: 20,
        });
        const detailed = await Promise.all(rows.map((r) => getForumPost(r.id)));
        setItems(detailed);
      } catch (e) {
        setItems([]);
        setError(e instanceof Error ? e.message : 'Não foi possível carregar o fórum.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter],
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const onPublish = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      const postType = activeFilter === 'todos' ? 'community' : activeFilter;
      const payload = {
        title: title.trim(),
        content: content.trim(),
        postType,
      } as const;
      await createForumPost(undefined, {
        ...payload,
      });
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
      await load(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }, [activeFilter, content, imageUri, load, title]);

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
  const userName = (user?.name ?? 'A').trim() || 'A';

  const onLike = useCallback(async (postId: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount + 1) } : p,
      ),
    );
    try {
      await likeForumPost(postId);
    } catch (e) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount - 1) } : p,
        ),
      );
      setError(e instanceof Error ? e.message : 'Não foi possível registrar o like.');
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <Text style={styles.subtitle}>
          Opiniões, dúvidas e avisos. Publicações de animais perdidos vindas da central de
          serviços aparecem aqui automaticamente.
        </Text>

        <FilterTabs
          filters={FILTERS}
          active={activeFilter}
          onSelect={(f) => setActiveFilter(f)}
          containerStyle={{ paddingBottom: 4 }}
        />
        <View style={styles.userCard}>
          <Ionicons name="people-outline" size={16} color={AppColors.primary} />
          <Text style={styles.userCardText}>Você participa como {userName}.</Text>
        </View>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.centerText}>Carregando publicações...</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.centerBlock}>
            <Text style={styles.centerText}>Ainda não há publicações nesta aba.</Text>
          </View>
        ) : null}

        {!loading && !error
          ? items.map((post) => (
              <View key={post.id} style={styles.card}>
                <View style={styles.authorRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(post.author?.name || 'A').trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{post.author?.name || 'Morador(a)'}</Text>
                    <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
                  </View>
                </View>

                <Text style={styles.title}>{post.title}</Text>
                <Text style={styles.content} numberOfLines={3}>
                  {post.content}
                </Text>
                {post.mediaId ? (
                  <Image
                    source={{ uri: forumPostImageUrl(post.mediaId) ?? '' }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ) : null}
                {post.locationDescription ? (
                  <Text style={styles.locationText}>📍 {post.locationDescription}</Text>
                ) : null}

                <View style={styles.footer}>
                  <Pressable
                    onPress={() => void onLike(post.id)}
                    style={({ pressed }) => [styles.likeBtn, pressed && styles.likeBtnPressed]}
                  >
                    <Text style={styles.metaText}>♡ {post.likesCount}</Text>
                  </Pressable>
                  <Text style={styles.metaText}>💬 {post.commentsCount} opiniões</Text>
                </View>
              </View>
            ))
          : null}
      </ScrollView>

      <TouchableOpacity
        style={styles.publishBtn}
        activeOpacity={0.9}
        onPress={() => setPublishOpen(true)}
      >
        <LinearGradient
          colors={['#0891b2', '#14b8a6']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.publishBtnGradient}
        >
          <Ionicons name="chatbubble-outline" size={20} color={AppColors.text.white} />
          <Text style={styles.publishBtnText}>Publicar</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={publishOpen} transparent animationType="fade" onRequestClose={() => setPublishOpen(false)}>
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
            <TextInput
              style={styles.input}
              placeholder="Foto (opcional)"
              editable={false}
              value={imageUri ? 'Imagem selecionada' : ''}
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

      <VisitanteLoginOverlay message="Para participar do fórum, faça login com uma conta cadastrada." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECEFF3' },
  scroll: { paddingTop: 10, paddingBottom: 100 },
  subtitle: {
    marginHorizontal: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: AppColors.text.tertiary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  centerBlock: { paddingVertical: 40, alignItems: 'center', gap: 8 },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600' },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCardText: {
    color: AppColors.text.tertiary,
    fontSize: 16 - 1,
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: { color: AppColors.status.error, fontWeight: '700' },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: AppColors.text.white, fontWeight: '700' },
  authorName: { fontSize: 16, fontWeight: '800', color: AppColors.text.secondary },
  timeText: { fontSize: 12, color: AppColors.text.tertiary, marginTop: 2 },
  title: { fontSize: 30 - 8, fontWeight: '800', color: AppColors.text.secondary, marginBottom: 6 },
  content: { fontSize: 16, lineHeight: 24, color: AppColors.text.secondary },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: AppColors.background.muted,
  },
  locationText: { marginTop: 8, color: AppColors.text.tertiary, fontSize: 14 },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    paddingTop: 10,
    flexDirection: 'row',
    gap: 14,
  },
  metaText: { color: AppColors.text.tertiary, fontWeight: '600' },
  likeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  likeBtnPressed: {
    opacity: 0.7,
  },
  publishBtn: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  publishBtnGradient: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishBtnText: { color: AppColors.text.white, fontWeight: '900', fontSize: 18 },
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
  modalTitle: { fontSize: 28 - 4, fontWeight: '900', color: AppColors.text.secondary },
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
