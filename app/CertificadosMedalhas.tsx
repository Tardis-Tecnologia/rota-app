import { AppColors } from '@/constants/theme';
import {
  getMyCourseAchievements,
  type CourseCertificate,
  type CourseMedal,
} from '@/services/educationApi';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MEDAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ribbon: 'ribbon',
  school: 'school',
  medal: 'medal',
  star: 'star',
  trophy: 'trophy',
  flame: 'flame',
};

function isBadge(medal: CourseMedal): boolean {
  return (
    medal.code.toUpperCase().startsWith('BADGE_') ||
    medal.iconKey === 'star' ||
    medal.iconKey === 'ribbon' ||
    /selo|badge/i.test(medal.title)
  );
}

export default function CertificadosMedalhasScreen() {
  const [certificates, setCertificates] = useState<CourseCertificate[]>([]);
  const [medals, setMedals] = useState<CourseMedal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyCourseAchievements();
      setCertificates(data.certificates ?? []);
      setMedals(data.medals ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar');
      setCertificates([]);
      setMedals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const { badgeItems, medalItems } = useMemo(() => {
    const badges = medals.filter(isBadge);
    const pureMedals = medals.filter((m) => !isBadge(m));
    // Se tudo veio marcado como badge, ainda mostra na seção Medalhas.
    return {
      badgeItems: badges.length > 0 ? badges : medals.slice(0, Math.min(3, medals.length)),
      medalItems: pureMedals.length > 0 ? pureMedals : medals,
    };
  }, [medals]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={AppColors.text.secondary} />
        </Pressable>
        <Text style={styles.topTitle}>Certificados e medalhas</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={AppColors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.section}>Badges</Text>
          {badgeItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="shield-outline" size={28} color={AppColors.text.quaternary} />
              <Text style={styles.emptyText}>
                Seus selos e badges de cursos municipais aparecerão aqui.
              </Text>
            </View>
          ) : (
            <View style={styles.badgeGrid}>
              {badgeItems.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <View style={styles.badgeIcon}>
                    <Ionicons
                      name={MEDAL_ICONS[badge.iconKey || ''] || 'ribbon'}
                      size={20}
                      color="#5B21B6"
                    />
                  </View>
                  <Text style={styles.badgeTitle} numberOfLines={2}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeBody} numberOfLines={2}>
                    {badge.description}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.section, { marginTop: 8 }]}>Medalhas</Text>
          {medalItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="medal-outline" size={28} color={AppColors.text.quaternary} />
              <Text style={styles.emptyText}>
                Conclua cursos municipais para conquistar medalhas.
              </Text>
            </View>
          ) : (
            medalItems.map((medal) => (
              <View key={medal.id} style={styles.medalCard}>
                <View style={styles.medalIcon}>
                  <Ionicons
                    name={MEDAL_ICONS[medal.iconKey || ''] || 'trophy'}
                    size={22}
                    color="#B45309"
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemTitle}>{medal.title}</Text>
                  <Text style={styles.itemBody}>{medal.description}</Text>
                  <Text style={styles.itemMeta}>
                    {new Date(medal.earnedAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Text style={[styles.section, { marginTop: 8 }]}>Certificados</Text>
          {certificates.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={28} color={AppColors.text.quaternary} />
              <Text style={styles.emptyText}>
                Seus certificados de conclusão de curso aparecerão aqui.
              </Text>
            </View>
          ) : (
            certificates.map((cert) => (
              <View key={cert.id} style={styles.certCard}>
                <Ionicons name="ribbon-outline" size={22} color={AppColors.primary} />
                <View style={styles.flex}>
                  <Text style={styles.itemTitle}>{cert.title}</Text>
                  {cert.courseTitle ? (
                    <Text style={styles.itemBody}>{cert.courseTitle}</Text>
                  ) : null}
                  <Text style={styles.itemMeta}>
                    Emitido em {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}
                    {cert.code ? ` · ${cert.code}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background.light },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border.muted,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 17, fontWeight: '800', color: AppColors.text.secondary },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  emptyText: {
    textAlign: 'center',
    color: AppColors.text.quaternary,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD6FE',
    gap: 6,
    minWidth: 140,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: { fontSize: 13, fontWeight: '800', color: '#4C1D95' },
  badgeBody: { fontSize: 12, color: AppColors.text.tertiary, lineHeight: 16 },
  medalCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FDE68A',
  },
  medalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
    alignItems: 'flex-start',
  },
  flex: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: AppColors.text.secondary },
  itemBody: { fontSize: 13, color: AppColors.text.tertiary, lineHeight: 18 },
  itemMeta: { fontSize: 12, color: AppColors.text.quaternary, marginTop: 2 },
  error: { color: '#b91c1c', marginBottom: 8 },
});
