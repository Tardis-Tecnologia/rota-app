import {
  forumDisplayHandle,
  profileLabel,
  withListImageCacheBust,
} from '@/components/forum/forumUtils';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById, type UserSummary } from '@/services/authApi';
import { findOrCreateDirectStreamChannel } from '@/services/streamChatApi';
import { streamAndUiDisplayName } from '@/utils/userDisplayName';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForumAuthorScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    userId?: string;
    name?: string;
    photoUrl?: string;
  }>();

  const userId = String(params.userId ?? '').trim();
  const isSelf = !!user?.id && userId === user.id;
  const isVisitante = user?.profile === 'VISITANTE';

  const [loading, setLoading] = useState(!!userId);
  const [profile, setProfile] = useState<UserSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const imageEpoch = useMemo(() => Date.now(), []);

  const fallbackName = (params.name ?? 'Morador(a)').trim() || 'Morador(a)';
  const displayName = (profile?.name ?? fallbackName).trim() || 'Morador(a)';
  const photoRaw = profile?.photoUrl?.trim() || params.photoUrl?.trim() || '';
  const photoUri = photoRaw ? withListImageCacheBust(photoRaw, imageEpoch) : null;
  const initial = displayName.charAt(0).toUpperCase() || 'M';
  const handle = forumDisplayHandle({ id: userId, name: displayName });
  const badge = profileLabel(profile?.profile);

  useEffect(() => {
    if (!userId) {
      setError('Perfil inválido.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserById(userId);
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) {
          setProfile(null);
          setError(e instanceof Error ? e.message : 'Não foi possível carregar o perfil.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const startChat = useCallback(async () => {
    if (!user?.id || !userId || isSelf || isVisitante) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const channel = await findOrCreateDirectStreamChannel({
        currentUserId: user.id,
        currentUserDisplayName: streamAndUiDisplayName(user) ?? user.name ?? 'Usuário',
        peerUserId: userId,
        peerName: displayName,
        peerImage: photoRaw || undefined,
      });
      router.push({
        pathname: '/ChatTab',
        params: {
          provider: JSON.stringify({
            id: userId,
            name: displayName,
            image: photoRaw || undefined,
            channelType: channel.channelType,
            channelId: channel.channelId,
            cid: channel.cid,
          }),
        },
      });
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Não foi possível iniciar a conversa.');
    } finally {
      setChatLoading(false);
    }
  }, [displayName, isSelf, isVisitante, photoRaw, user, userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.centerText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={40} color={AppColors.text.quaternary} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.handle}>{handle}</Text>
          <Text style={styles.subtitle}>Participante do fórum do bairro</Text>

          {badge ? (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#0e7490" />
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}

          {profile?.uf?.trim() ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={AppColors.text.tertiary} />
              <Text style={styles.metaText}>UF: {profile.uf.trim()}</Text>
            </View>
          ) : null}

          {isSelf ? (
            <View style={styles.selfHint}>
              <Ionicons name="information-circle-outline" size={18} color="#64748b" />
              <Text style={styles.selfHintText}>Este é o seu perfil.</Text>
            </View>
          ) : null}
        </View>

        {!isSelf && user && !isVisitante ? (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Conversar</Text>
            <Text style={styles.actionsHint}>
              Envie uma mensagem privada. A conversa aparece em Mensagens.
            </Text>

            {chatError ? (
              <View style={styles.chatErrorBox}>
                <Text style={styles.chatErrorText}>{chatError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void startChat()}
              disabled={chatLoading}
              style={({ pressed }) => [pressed && !chatLoading && styles.chatBtnPressed]}
            >
              <LinearGradient
                colors={['#0e7490', '#0891b2', '#14b8a6']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.chatGradient}
              >
                {chatLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                    <Text style={styles.chatBtnText}>Iniciar conversa</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}

        {isVisitante && !isSelf ? (
          <Text style={styles.loginHint}>Faça login para enviar mensagens a este morador.</Text>
        ) : null}
      </ScrollView>

      <VisitanteLoginOverlay message="Para ver perfis e conversar no fórum, faça login com uma conta cadastrada." />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECEFF3' },
  scroll: { padding: 16, gap: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
    backgroundColor: '#ECEFF3',
  },
  centerText: { color: AppColors.text.tertiary, fontWeight: '600' },
  errorText: {
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 6,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#0891b2',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 8 },
  handle: { fontSize: 14, fontWeight: '700', color: '#0e7490' },
  subtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecfeff',
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#0e7490' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: { fontSize: 13, color: AppColors.text.tertiary, fontWeight: '600' },
  selfHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  selfHintText: { fontSize: 13, color: AppColors.text.tertiary, fontWeight: '600' },
  actionsCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 10,
  },
  actionsTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  actionsHint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
    fontWeight: '500',
  },
  chatErrorBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  chatErrorText: { color: AppColors.status.error, fontWeight: '700', fontSize: 13 },
  chatBtnPressed: { opacity: 0.92 },
  chatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  chatBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  loginHint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});
