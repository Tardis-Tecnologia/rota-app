import {
  COMERCIANTE_HEADER_STATS,
  COMERCIANTE_METRICS,
  COMERCIANTE_NOTIFICACOES,
} from '@/data/comercianteMock';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

export default function ComerciantePainelScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const lojaNome = user?.name?.trim() || 'Loja Demo Rota';
  const avatarUri = user?.photoUrl?.trim() || DEFAULT_AVATAR;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[...HEADER_GRADIENT]}
          start={{ x: 0.1, y: 0.05 }}
          end={{ x: 0.9, y: 0.95 }}
          style={[styles.headerCard, { paddingTop: Math.max(insets.top, 16) + 10 }]}
        >
          <View style={styles.headerInner}>
          <View style={styles.headerTop}>
            <View style={styles.headerProfile}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={styles.headerTitles}>
                <Text style={styles.contaLabel}>CONTA COMÉRCIO</Text>
                <Text style={styles.lojaNome}>{lojaNome}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
              hitSlop={8}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.headerDesc}>
            Acompanhe uso dos cupons e responda a comunidade com a mesma experiência visual do app.
          </Text>

          <View style={styles.statsRow}>
            <StatBox label="CUPONS" value={COMERCIANTE_HEADER_STATS.cupons} />
            <StatBox label="USO" value={COMERCIANTE_HEADER_STATS.uso} />
            <StatBox label="CONTATOS" value={COMERCIANTE_HEADER_STATS.contatos} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.forumBtn, pressed && styles.forumBtnPressed]}
            onPress={() => router.push('/comerciante/forum')}
          >
            <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
            <Text style={styles.forumBtnText}>Publicar no fórum</Text>
          </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.body}>
        <View style={styles.actionPanel}>
          <Text style={styles.actionPanelTitle}>PAINEL DE AÇÃO</Text>
          <Text style={styles.actionPanelDesc}>
            Objetivo do painel: responder rápido clientes e acompanhar uso de cupons.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>HOJE</Text>
            <Text style={styles.metricValue}>{COMERCIANTE_METRICS.cuponsAtivosHoje}</Text>
            <Text style={styles.metricHint}>Cupons ativos da loja</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ENGAJAMENTO</Text>
            <Text style={styles.metricValue}>{COMERCIANTE_METRICS.engajamento}</Text>
            <Text style={styles.metricHint}>Interações estimadas no bairro</Text>
          </View>
        </View>

        <View style={styles.notifCard}>
          <View style={styles.notifHeader}>
            <View style={styles.notifTitleRow}>
              <Ionicons name="notifications-outline" size={20} color="#1e293b" />
              <Text style={styles.notifTitle}>Notificações de uso de cupom</Text>
            </View>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3 novas</Text>
            </View>
          </View>

          {COMERCIANTE_NOTIFICACOES.map((item) => (
            <View key={item.id} style={styles.notifItem}>
              <Image source={{ uri: item.avatar }} style={styles.notifAvatar} />
              <View style={styles.notifBody}>
                <Text style={styles.notifText}>
                  <Text style={styles.notifName}>{item.nome}</Text> {item.acao}
                </Text>
                <Text style={styles.notifTime}>{item.tempo}</Text>
              </View>
            </View>
          ))}
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scroll: {
    paddingBottom: 24,
  },
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
  body: {
    paddingHorizontal: 16,
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
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnPressed: {
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
  actionPanel: {
    backgroundColor: '#e0f2fe',
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(14, 116, 144, 0.12)',
  },
  actionPanelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: 0.6,
  },
  actionPanelDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  metricHint: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flexShrink: 1,
  },
  notifBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  notifBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d9488',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  notifAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notifBody: {
    flex: 1,
    gap: 4,
  },
  notifText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  notifName: {
    fontWeight: '700',
    color: '#1e293b',
  },
  notifTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
