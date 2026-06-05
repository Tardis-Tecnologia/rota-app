import ComercianteHeader from '@/components/comerciante/ComercianteHeader';
import ComercianteSectionBanner from '@/components/comerciante/ComercianteSectionBanner';
import { useComercianteStore } from '@/contexts/ComercianteStoreContext';
import { formatRelativeTimePt } from '@/utils/formatRelativeTime';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function displayUserName(name: string | undefined, userId: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return `Cliente ${userId.slice(0, 6)}`;
}

export default function ComerciantePainelScreen() {
  const { metrics, historicoUso, headerStats, statsLoading } = useComercianteStore();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ComercianteHeader />

        <View style={styles.body}>
          <ComercianteSectionBanner
            title="PAINEL DE AÇÃO"
            description="Objetivo do painel: responder rápido clientes e acompanhar uso de cupons."
          />

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>HOJE</Text>
              <Text style={styles.metricValue}>{metrics.cuponsAtivosHoje}</Text>
              <Text style={styles.metricHint}>Cupons ativos da loja</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>ENGAJAMENTO</Text>
              <Text style={styles.metricValue}>{metrics.engajamento}</Text>
              <Text style={styles.metricHint}>Curtidas e comentários nos seus posts</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.marketplaceCard, pressed && styles.marketplaceCardPressed]}
            onPress={() => router.push('/comerciante/marketplace')}
          >
            <View style={styles.marketplaceIconWrap}>
              <Ionicons name="bag-handle-outline" size={22} color="#7c3aed" />
            </View>
            <View style={styles.marketplaceTextWrap}>
              <Text style={styles.marketplaceTitle}>Marketplace da loja</Text>
              <Text style={styles.marketplaceHint}>
                Publique produtos e veja o catálogo das lojas do bairro.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>

          <View style={styles.notifCard}>
            <View style={styles.notifHeader}>
              <View style={styles.notifTitleRow}>
                <Ionicons name="time-outline" size={20} color="#1e293b" />
                <Text style={styles.notifTitle}>Histórico de uso</Text>
              </View>
              {headerStats.uso > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {headerStats.uso} {headerStats.uso === 1 ? 'uso' : 'usos'}
                  </Text>
                </View>
              ) : null}
            </View>

            {statsLoading ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator color="#0d9488" />
              </View>
            ) : historicoUso.length === 0 ? (
              <Text style={styles.historyEmpty}>
                Nenhum cupom usado ainda. Valide um QR na loja para ver o histórico aqui.
              </Text>
            ) : (
              historicoUso.map((item) => {
                const nome = displayUserName(item.userName, item.userId);
                return (
                  <View key={item.id} style={styles.notifItem}>
                    {item.userPhotoUrl ? (
                      <Image source={{ uri: item.userPhotoUrl }} style={styles.notifAvatar} />
                    ) : (
                      <View style={styles.notifAvatarPlaceholder}>
                        <Ionicons name="person" size={22} color="#64748b" />
                      </View>
                    )}
                    <View style={styles.notifBody}>
                      <Text style={styles.notifText}>
                        <Text style={styles.notifName}>{nome}</Text> usou o cupom{' '}
                        <Text style={styles.notifCode}>{item.couponCode}</Text>
                      </Text>
                      <Text style={styles.notifTime}>
                        {formatRelativeTimePt(item.usedAt)}
                        {item.couponName ? ` • ${item.couponName}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
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
  body: {
    paddingHorizontal: 16,
    gap: 14,
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
  marketplaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  marketplaceCardPressed: {
    opacity: 0.92,
  },
  marketplaceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceTextWrap: {
    flex: 1,
    gap: 4,
  },
  marketplaceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  marketplaceHint: {
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
  historyLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  historyEmpty: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    paddingVertical: 8,
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
  notifAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
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
  notifCode: {
    fontWeight: '700',
    color: '#1e293b',
  },
  notifTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
