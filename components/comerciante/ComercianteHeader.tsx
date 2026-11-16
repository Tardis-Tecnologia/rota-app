import { openMyCommercialStoreProfile } from '@/components/forum/forumUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useComercianteStore } from '@/contexts/ComercianteStoreContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_GRADIENT = ['#1e40af', '#0e7490', '#14b8a6'] as const;
const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?u=loja-demo-rota';

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

type ComercianteHeaderProps = {
  showForumButton?: boolean;
};

export default function ComercianteHeader({ showForumButton = true }: ComercianteHeaderProps) {
  const { user, logout } = useAuth();
  const { headerStats } = useComercianteStore();
  const insets = useSafeAreaInsets();
  const lojaNome = user?.name?.trim() || 'Minha loja';
  const avatarUri = user?.photoUrl?.trim() || DEFAULT_AVATAR;

  const openStoreProfile = () => {
    if (!user?.id) return;
    openMyCommercialStoreProfile(user, router);
  };

  const handleLogout = () => {
    void logout();
  };

  return (
    <LinearGradient
      colors={[...HEADER_GRADIENT]}
      start={{ x: 0.1, y: 0.05 }}
      end={{ x: 0.9, y: 0.95 }}
      style={[styles.headerCard, { paddingTop: Math.max(insets.top, 16) + 10 }]}
    >
      <View style={styles.headerInner}>
        <View style={styles.headerTop}>
          <View style={styles.headerProfile}>
            <Pressable
              onPress={openStoreProfile}
              style={({ pressed }) => [pressed && styles.avatarPressed]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Ver perfil da loja no feed"
            >
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            </Pressable>
            <View style={styles.headerTitles}>
              <Text style={styles.contaLabel}>CONTA COMÉRCIO</Text>
              <Text style={styles.lojaNome} numberOfLines={2}>
                {lojaNome}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Notificações"
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/comerciante/mensagens')}
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mensagens"
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Sair"
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.headerDesc}>
          Acompanhe uso dos cupons e responda a comunidade com a mesma experiência visual do app.
        </Text>

        <View style={styles.statsRow}>
          <StatBox label="CUPONS" value={headerStats.cupons} />
          <StatBox label="USO" value={headerStats.uso} />
          <StatBox label="CONTATOS" value={headerStats.contatos} />
        </View>

        {showForumButton ? (
          <Pressable
            style={({ pressed }) => [styles.forumBtn, pressed && styles.forumBtnPressed]}
            onPress={() => router.push('/comerciante/forum')}
          >
            <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
            <Text style={styles.forumBtnText}>Publicar no feed</Text>
          </Pressable>
        ) : null}
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerInner: {
    paddingHorizontal: 20,
    gap: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarPressed: {
    opacity: 0.85,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  contaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.8,
  },
  lojaNome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  headerDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  forumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 64, 175, 0.55)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  forumBtnPressed: {
    opacity: 0.9,
  },
  forumBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
