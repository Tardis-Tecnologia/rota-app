import ComercianteHeader from '@/components/comerciante/ComercianteHeader';
import ComercianteSectionBanner from '@/components/comerciante/ComercianteSectionBanner';
import { useComercianteStore } from '@/contexts/ComercianteStoreContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const RECOMENDACOES = [
  'Reative o cupom com melhor desempenho na semana.',
  'Poste no fórum com CTA direto para aumentar conversão.',
  'Teste um desconto novo em horários de menor movimento.',
] as const;

export default function ComercianteMetricasScreen() {
  const { headerStats } = useComercianteStore();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ComercianteHeader showForumButton={false} />

        <View style={styles.body}>
          <ComercianteSectionBanner
            title="INTELIGÊNCIA DA LOJA"
            description="Objetivo de métricas: decidir próximos cupons com base nos resultados."
          />

          <View style={styles.performanceCard}>
            <View style={styles.performanceTitleRow}>
              <Ionicons name="trending-up-outline" size={22} color="#1e293b" />
              <Text style={styles.performanceTitle}>Performance da loja</Text>
            </View>

            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>USO DE CUPOM</Text>
                <Text style={styles.performanceValue}>{headerStats.uso}</Text>
                <Text style={styles.performanceHint}>vezes resgatado</Text>
              </View>
              <View style={styles.performanceItem}>
                <View style={styles.performanceLabelRow}>
                  <Ionicons name="search-outline" size={14} color="#94a3b8" />
                  <Text style={styles.performanceLabel}>BUSCAS DA LOJA</Text>
                </View>
                <Text style={styles.performanceValue}>24</Text>
                <Text style={styles.performanceHint}>procura no app</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>CONTATOS</Text>
                <Text style={styles.performanceValue}>{headerStats.contatos}</Text>
                <Text style={styles.performanceHint}>interesses gerados</Text>
              </View>
            </View>
          </View>

          <View style={styles.recommendCard}>
            <Text style={styles.recommendTitle}>Ações recomendadas</Text>
            {RECOMENDACOES.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
            <Pressable
              style={({ pressed }) => [styles.campaignBtn, pressed && styles.campaignBtnPressed]}
              onPress={() => router.push('/comerciante/forum')}
            >
              <Text style={styles.campaignBtnText}>Criar campanha no fórum</Text>
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
    gap: 14,
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
  performanceGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  performanceItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    alignItems: 'center',
  },
  performanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performanceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  performanceHint: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 15,
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
