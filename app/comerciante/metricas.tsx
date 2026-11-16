import ComercianteHeader from '@/components/comerciante/ComercianteHeader';
import ComercianteSectionBanner from '@/components/comerciante/ComercianteSectionBanner';
import { useComercianteStore } from '@/contexts/ComercianteStoreContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type MetricTileProps = {
  label: string;
  value: string | number;
  hint: string;
  accent?: string;
};

function MetricTile({ label, value, hint, accent = '#1e293b' }: MetricTileProps) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricTileLabel}>{label}</Text>
      <Text style={[styles.metricTileValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricTileHint}>{hint}</Text>
    </View>
  );
}

type MetricSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function MetricSection({ icon, title, subtitle, children }: MetricSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={18} color="#0d9488" />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function buildRecommendations(input: {
  cuponsAtivos: number;
  resgatadosNoApp: number;
  validadosNaLoja: number;
  contatosTotal: number;
  postsForum: number;
}): string[] {
  const tips: string[] = [];

  if (input.cuponsAtivos === 0) {
    tips.push('Crie pelo menos um cupom ativo para começar a medir resultados.');
  }
  if (input.resgatadosNoApp > input.validadosNaLoja) {
    tips.push(
      'Há cupons resgatados no app que ainda não foram validados na loja — lembre o cliente de usar o QR.',
    );
  }
  if (input.contatosTotal > 0 && input.validadosNaLoja === 0) {
    tips.push('Você recebe contatos pelo feed, mas ainda não validou cupons — reforce o código na conversa.');
  }
  if (input.postsForum === 0) {
    tips.push('Publique no feed com cupom vinculado para gerar interesse e contatos.');
  } else if (input.contatosTotal === 0) {
    tips.push('Inclua um CTA claro (“Falar com a loja”) nos posts para transformar visualizações em contatos.');
  }
  if (input.validadosNaLoja > 0 && tips.length < 3) {
    tips.push('Reative ou renove o cupom com mais validações para manter o movimento.');
  }
  if (tips.length < 3) {
    tips.push('Teste um desconto novo em horários de menor movimento.');
  }

  return tips.slice(0, 3);
}

export default function ComercianteMetricasScreen() {
  const { headerStats, contactMetrics, statsLoading } = useComercianteStore();

  const metrics = useMemo(() => {
    const resgatadosNoApp = contactMetrics?.couponUsagesTotal ?? 0;
    const validadosNaLoja = headerStats.uso;
    const contatosTotal = contactMetrics?.contactsTotal ?? headerStats.contatos;
    const contatos7d = contactMetrics?.contactsLast7Days ?? 0;
    const contatos30d = contactMetrics?.contactsLast30Days ?? 0;
    const postsForum = contactMetrics?.forumPostsTotal ?? 0;
    const engajamentoForum = contactMetrics?.forumEngagementTotal ?? 0;

    const taxaValidacao =
      resgatadosNoApp > 0 ? Math.min(100, Math.round((validadosNaLoja / resgatadosNoApp) * 100)) : null;

    const pendenteValidacao = Math.max(0, resgatadosNoApp - validadosNaLoja);

    return {
      resgatadosNoApp,
      validadosNaLoja,
      contatosTotal,
      contatos7d,
      contatos30d,
      postsForum,
      engajamentoForum,
      taxaValidacao,
      pendenteValidacao,
      cuponsAtivos: headerStats.cupons,
    };
  }, [contactMetrics, headerStats.contatos, headerStats.cupons, headerStats.uso]);

  const recomendacoes = useMemo(
    () =>
      buildRecommendations({
        cuponsAtivos: metrics.cuponsAtivos,
        resgatadosNoApp: metrics.resgatadosNoApp,
        validadosNaLoja: metrics.validadosNaLoja,
        contatosTotal: metrics.contatosTotal,
        postsForum: metrics.postsForum,
      }),
    [metrics],
  );

  const loading = statsLoading ? '—' : undefined;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ComercianteHeader showForumButton={false} />

        <View style={styles.body}>
          <ComercianteSectionBanner
            title="INTELIGÊNCIA DA LOJA"
            description="Acompanhe o funil: interesse no app → validação na loja → contatos pelo feed."
          />

          <View style={styles.performanceCard}>
            <View style={styles.performanceTitleRow}>
              <Ionicons name="trending-up-outline" size={22} color="#1e293b" />
              <Text style={styles.performanceTitle}>Performance da loja</Text>
            </View>

            <MetricSection
              icon="ticket-outline"
              title="Cupons"
              subtitle="Do resgate no app até a confirmação na loja"
            >
              <View style={styles.metricRow}>
                <MetricTile
                  label="CUPONS ATIVOS"
                  value={loading ?? metrics.cuponsAtivos}
                  hint="campanhas disponíveis agora"
                />
                <MetricTile
                  label="RESGATADOS NO APP"
                  value={loading ?? metrics.resgatadosNoApp}
                  hint="moradores que pegaram o cupom"
                  accent="#2563eb"
                />
                <MetricTile
                  label="VALIDADOS NA LOJA"
                  value={loading ?? metrics.validadosNaLoja}
                  hint="confirmados via QR na loja"
                  accent="#0d9488"
                />
              </View>

              {!statsLoading ? (
                <View style={styles.funnelCard}>
                  <View style={styles.funnelSteps}>
                    <View style={styles.funnelStep}>
                      <Text style={styles.funnelStepValue}>{metrics.resgatadosNoApp}</Text>
                      <Text style={styles.funnelStepLabel}>Resgatados</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
                    <View style={styles.funnelStep}>
                      <Text style={[styles.funnelStepValue, styles.funnelStepValueAccent]}>
                        {metrics.validadosNaLoja}
                      </Text>
                      <Text style={styles.funnelStepLabel}>Validados</Text>
                    </View>
                  </View>
                  {metrics.taxaValidacao != null ? (
                    <>
                      <View style={styles.funnelBarTrack}>
                        <View
                          style={[styles.funnelBarFill, { width: `${metrics.taxaValidacao}%` }]}
                        />
                      </View>
                      <Text style={styles.funnelHint}>
                        {metrics.taxaValidacao}% dos resgates viraram uso na loja
                        {metrics.pendenteValidacao > 0
                          ? ` · ${metrics.pendenteValidacao} aguardando validação`
                          : ''}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.funnelHint}>
                      Quando alguém resgatar no app, você verá aqui quantos vieram à loja.
                    </Text>
                  )}
                </View>
              ) : null}
            </MetricSection>

            <View style={styles.sectionDivider} />

            <MetricSection
              icon="chatbubble-ellipses-outline"
              title="Contatos"
              subtitle="Moradores que tocaram em “Falar com a loja” no feed"
            >
              <View style={styles.metricRow}>
                <MetricTile
                  label="TOTAL"
                  value={loading ?? metrics.contatosTotal}
                  hint="desde o início"
                />
                <MetricTile
                  label="7 DIAS"
                  value={loading ?? metrics.contatos7d}
                  hint="contatos recentes"
                />
                <MetricTile
                  label="30 DIAS"
                  value={loading ?? metrics.contatos30d}
                  hint="último mês"
                />
              </View>
            </MetricSection>

            <View style={styles.sectionDivider} />

            <MetricSection
              icon="megaphone-outline"
              title="Feed"
              subtitle="Presença e reação da comunidade às suas publicações"
            >
              <View style={styles.metricRowTwo}>
                <MetricTile
                  label="PUBLICAÇÕES"
                  value={loading ?? metrics.postsForum}
                  hint="posts da loja no feed"
                />
                <MetricTile
                  label="ENGAJAMENTO"
                  value={loading ?? metrics.engajamentoForum}
                  hint="curtidas + comentários"
                  accent="#7c3aed"
                />
              </View>
            </MetricSection>
          </View>

          <View style={styles.recommendCard}>
            <Text style={styles.recommendTitle}>Ações recomendadas</Text>
            {recomendacoes.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
            <Pressable
              style={({ pressed }) => [styles.campaignBtn, pressed && styles.campaignBtnPressed]}
              onPress={() => router.push('/comerciante/forum')}
            >
              <Text style={styles.campaignBtnText}>Criar campanha no feed</Text>
            </Pressable>
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
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  performanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricRowTwo: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 10,
    gap: 4,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  metricTileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  metricTileValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
  },
  metricTileHint: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 14,
  },
  funnelCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  funnelSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  funnelStep: {
    alignItems: 'center',
    gap: 2,
    minWidth: 72,
  },
  funnelStepValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563eb',
  },
  funnelStepValueAccent: {
    color: '#0d9488',
  },
  funnelStepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  funnelBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  funnelBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0d9488',
  },
  funnelHint: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 17,
  },
  recommendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#0d9488',
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  campaignBtn: {
    marginTop: 8,
    backgroundColor: '#0d9488',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  campaignBtnPressed: {
    opacity: 0.9,
  },
  campaignBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
