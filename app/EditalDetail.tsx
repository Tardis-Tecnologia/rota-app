import { findMaricaEdital } from '@/constants/maricaEditais';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export default function EditalDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edital = findMaricaEdital(String(id ?? '').trim());
  const [opening, setOpening] = useState(false);

  const openRegistration = useCallback(async () => {
    if (!edital || opening) return;
    setOpening(true);
    try {
      await Linking.openURL(edital.registrationUrl);
    } catch {
      Alert.alert('Link indisponível', 'Não foi possível abrir o site oficial deste edital.');
    } finally {
      setOpening(false);
    }
  }, [edital, opening]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/JobsTab'))}
          hitSlop={12}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edital</Text>
        <View style={styles.headerBalance} />
      </View>

      {!edital ? (
        <View style={styles.missing}>
          <Text style={styles.missingText}>Este edital não está mais na lista.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.status}>{edital.status}</Text>
          <Text style={styles.title}>{edital.title}</Text>
          <Text style={styles.organ}>{edital.organ}</Text>
          <Text style={styles.about}>{edital.about}</Text>

          <View style={styles.facts}>
            <Fact label="Vagas" value={edital.spots} />
            <Fact label="Período" value={edital.period} />
            <Fact label="Quem pode participar" value={edital.who} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={() => void openRegistration()}
            disabled={opening}
            accessibilityRole="link"
            accessibilityLabel={edital.actionLabel}
          >
            <Ionicons name="open-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>{opening ? 'Abrindo…' : edital.actionLabel}</Text>
          </Pressable>
          <Text style={styles.linkHint}>
            Abre o site oficial ({edital.registrationLabel}) fora do app.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background.default },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  back: { padding: 8, borderRadius: 20 },
  backPressed: { backgroundColor: AppColors.background.overlayPressed },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', color: AppColors.text.secondary },
  headerBalance: { width: 40 },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  status: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', lineHeight: 30 },
  organ: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  about: { fontSize: 15, lineHeight: 22, color: '#334155' },
  facts: { gap: 10, marginTop: 4 },
  fact: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  factLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  factValue: { fontSize: 14, lineHeight: 20, color: '#1e293b' },
  cta: {
    marginTop: 8,
    backgroundColor: '#312E82',
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  linkHint: { fontSize: 12, lineHeight: 18, color: '#94a3b8', textAlign: 'center' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingText: { fontSize: 15, color: AppColors.text.tertiary, textAlign: 'center' },
});
