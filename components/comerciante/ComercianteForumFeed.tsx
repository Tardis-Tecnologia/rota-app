import ComercianteMyStorePostsSection from '@/components/comerciante/ComercianteMyStorePostsSection';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { emailToStoreHandle } from '@/utils/comercianteHandle';
import { uploadForumImageFromUri } from '@/services/forumApi';
import { createCommercialForumPost } from '@/services/commercialForumApi';
import {
  listCommercialCoupons,
  type CommercialCoupon,
} from '@/services/commercialCouponsApi';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ComercianteForumFeed() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [allFeedReloadToken, setAllFeedReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<CommercialCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  const lojaNome = user?.name?.trim() || 'Minha loja';
  const lojaHandle = emailToStoreHandle(user?.email ?? 'loja@rota.com');

  const loadCoupons = useCallback(async () => {
    try {
      const rows = await listCommercialCoupons('true');
      setCoupons(rows);
    } catch {
      setCoupons([]);
    }
  }, []);

  const onPublish = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      let mediaId: string | undefined;
      if (imageUri) {
        const up = await uploadForumImageFromUri(imageUri);
        mediaId = up.id;
      }
      await createCommercialForumPost({
        title: title.trim(),
        content: content.trim(),
        ...(selectedCouponId ? { commercialCouponId: selectedCouponId } : {}),
        ...(mediaId ? { mediaId } : {}),
      });
      setPublishOpen(false);
      setTitle('');
      setContent('');
      setImageUri(null);
      setSelectedCouponId(null);
      setAllFeedReloadToken((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }, [content, imageUri, selectedCouponId, title]);

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
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarSpacer} />
          <View style={styles.topBarCenter}>
            <Text style={styles.screenTitle}>Fórum do bairro</Text>
            <Text style={styles.screenSubtitle}>
              Divulgue promoções da sua loja. Você vê apenas suas publicações; cidadãos veem no
              feed geral com a tag da loja.
            </Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.identityBar}>
          <Ionicons name="people-outline" size={18} color="#0f766e" />
          <Text style={styles.identityText}>
            Você participa como <Text style={styles.identityBold}>{lojaNome}</Text> ({lojaHandle}
            ).
          </Text>
        </View>
      </View>

      <ComercianteMyStorePostsSection
        refreshing={refreshing}
        onRefresh={startRefresh}
        onRefreshComplete={endRefresh}
        reloadToken={allFeedReloadToken}
      />

      <TouchableOpacity
        style={styles.publishBtn}
        activeOpacity={0.9}
        onPress={() => {
          void loadCoupons();
          setPublishOpen(true);
        }}
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
            <Text style={styles.modalTitle}>Nova promoção no fórum</Text>
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
            {coupons.length > 0 ? (
              <View style={styles.couponPickSection}>
                <Text style={styles.couponPickLabel}>Cupom vinculado (opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Pressable
                    style={[styles.couponChip, !selectedCouponId && styles.couponChipActive]}
                    onPress={() => setSelectedCouponId(null)}
                  >
                    <Text
                      style={[
                        styles.couponChipText,
                        !selectedCouponId && styles.couponChipTextActive,
                      ]}
                    >
                      Nenhum
                    </Text>
                  </Pressable>
                  {coupons.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.couponChip,
                        selectedCouponId === c.id && styles.couponChipActive,
                      ]}
                      onPress={() => setSelectedCouponId(c.id)}
                    >
                      <Text
                        style={[
                          styles.couponChipText,
                          selectedCouponId === c.id && styles.couponChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {c.name} ({c.discountPercent}%)
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
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
  container: { flex: 1, backgroundColor: '#ECEFF3' },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topBarSpacer: { width: 32 },
  topBarCenter: { flex: 1, gap: 6, alignItems: 'center' },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    textAlign: 'center',
  },
  identityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  identityText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  identityBold: {
    fontWeight: '700',
    color: '#0f766e',
  },
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
  publishBtn: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    borderRadius: 16,
    shadowColor: '#000',
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
  couponPickSection: { gap: 8 },
  couponPickLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  couponChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    maxWidth: 200,
  },
  couponChipActive: {
    borderColor: '#0d9488',
    backgroundColor: '#ccfbf1',
  },
  couponChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  couponChipTextActive: { color: '#0f766e' },
});
