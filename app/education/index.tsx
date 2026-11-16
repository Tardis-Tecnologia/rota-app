import { AppColors } from '@/constants/theme';
import { mockEnrichedRequests, mockEnrollments } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type HubItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  tintBg: string;
  badge?: string;
};

const SHORTCUTS: HubItem[] = [
  {
    key: 'minhas',
    title: 'Minhas matrículas',
    description: 'Alunos vinculados',
    href: '/education/minhas-matriculas',
    icon: 'people-outline',
    tint: '#0369a1',
    tintBg: '#e0f2fe',
  },
  {
    key: 'solic',
    title: 'Solicitações',
    description: 'Protocolos',
    href: '/education/solicitacoes',
    icon: 'clipboard-outline',
    tint: '#b45309',
    tintBg: '#fef3c7',
  },
];

const CATEGORIES: { title: string; items: HubItem[] }[] = [
  {
    title: 'Vida escolar',
    items: [
      {
        key: 'boletim',
        title: 'Boletim',
        description: 'Notas e médias',
        href: '/education/boletim',
        icon: 'ribbon-outline',
        tint: '#047857',
        tintBg: '#d1fae5',
      },
      {
        key: 'freq',
        title: 'Frequência',
        description: 'Presenças e faltas',
        href: '/education/frequencia',
        icon: 'stats-chart-outline',
        tint: '#0369a1',
        tintBg: '#e0f2fe',
      },
      {
        key: 'transfer',
        title: 'Transferência',
        description: 'Mudança de escola',
        href: '/education/transferencia',
        icon: 'swap-horizontal-outline',
        tint: '#7c3aed',
        tintBg: '#ede9fe',
      },
      {
        key: 'cal',
        title: 'Calendário',
        description: 'Provas e eventos',
        href: '/education/calendario',
        icon: 'calendar-outline',
        tint: '#be185d',
        tintBg: '#fce7f3',
      },
      {
        key: 'com',
        title: 'Comunicados',
        description: 'Avisos da escola',
        href: '/education/comunicados',
        icon: 'notifications-outline',
        tint: '#b45309',
        tintBg: '#fef3c7',
      },
      {
        key: 'menu',
        title: 'Alimentação',
        description: 'Cardápio da semana',
        href: '/education/alimentacao',
        icon: 'restaurant-outline',
        tint: '#047857',
        tintBg: '#d1fae5',
      },
    ],
  },
  {
    title: 'Serviços e documentos',
    items: [
      {
        key: 'docs',
        title: 'Documentos',
        description: 'Declarações e pedidos',
        href: '/education/documentos',
        icon: 'folder-outline',
        tint: '#334155',
        tintBg: '#f1f5f9',
      },
      {
        key: 'ouv',
        title: 'Ouvidoria',
        description: 'Reclamações e sugestões',
        href: '/education/ouvidoria',
        icon: 'chatbubbles-outline',
        tint: '#9f1239',
        tintBg: '#ffe4e6',
      },
    ],
  },
];

export default function EducationHubScreen() {
  const pendingCount = useMemo(
    () => mockEnrichedRequests.filter((r) => r.status === 'PENDING' || r.status === 'IN_REVIEW').length,
    [],
  );
  const enrollmentCount = mockEnrollments.length;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable
        style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
        onPress={() => router.push('/education/prematricula' as Href)}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Matrícula 2026</Text>
          </View>
          <Ionicons name="school" size={28} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Pré-matrícula</Text>
        <Text style={styles.heroText}>
          Reserve a vaga na rede municipal: creche, fundamental ou médio.
        </Text>
        <View style={styles.heroCta}>
          <Text style={styles.heroCtaText}>Começar agora</Text>
          <Ionicons name="arrow-forward" size={16} color={AppColors.primary} />
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.feature, pressed && styles.pressed]}
        onPress={() => router.push('/education/cursos' as Href)}
      >
        <View style={styles.featureIcon}>
          <Ionicons name="book" size={22} color="#fff" />
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureEyebrow}>Destaque</Text>
          <Text style={styles.featureTitle}>Cursos</Text>
          <Text style={styles.featureDesc}>
            Ofertas gratuitas da prefeitura: EJA, informática, idiomas e mais.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </Pressable>

      <Text style={styles.sectionLabel}>Para você</Text>
      <View style={styles.shortcuts}>
        {SHORTCUTS.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
            onPress={() => router.push(item.href as Href)}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: item.tintBg }]}>
              <Ionicons name={item.icon} size={18} color={item.tint} />
            </View>
            <Text style={styles.shortcutTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.shortcutDesc} numberOfLines={1}>
              {item.key === 'minhas'
                ? `${enrollmentCount} aluno(s)`
                : `${pendingCount} em andamento`}
            </Text>
          </Pressable>
        ))}
      </View>

      {CATEGORIES.map((category) => (
        <View key={category.title} style={styles.category}>
          <Text style={styles.sectionLabel}>{category.title}</Text>
          <View style={styles.list}>
            {category.items.map((item) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => router.push(item.href as Href)}
              >
                <View style={[styles.rowIcon, { backgroundColor: item.tintBg }]}>
                  <Ionicons name={item.icon} size={20} color={item.tint} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowDesc}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  hero: {
    backgroundColor: AppColors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  heroText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  heroCta: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroCtaText: {
    color: AppColors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f766e',
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, minWidth: 0 },
  featureEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  featureTitle: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  featureDesc: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcut: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  shortcutIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  shortcutDesc: {
    marginTop: 2,
    fontSize: 11,
    color: AppColors.text.quaternary,
  },
  category: {
    marginTop: 4,
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  rowDesc: {
    marginTop: 2,
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  pressed: { opacity: 0.88 },
});
