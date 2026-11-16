import HealthCarousel from '@/components/HealthCarousel';
import HealthFacilities from '@/components/HealthFacilities';
import HealthUnitProfileSheet from '@/components/HealthUnitProfileSheet';
import { Card, InfoRow, ScreenHeader, SectionTitle, ps } from '@/components/publicServices/ui';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import {
  clearReferenceUnit,
  getReferenceUnit,
  type HealthUnit,
} from '@/services/healthApi';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Action = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  fg: string;
  bg: string;
  href: Href;
  feature: string;
};

const actions: Action[] = [
  {
    key: 'consult',
    label: 'Agendar consulta',
    description: 'Clínico, pediatra, dentista, ginecologista',
    icon: 'calendar-outline',
    fg: '#0369A1',
    bg: '#E0F2FE',
    href: { pathname: '/saude/agendar', params: { kind: 'CONSULTATION' } },
    feature: 'agendar consultas',
  },
  {
    key: 'exam',
    label: 'Agendar exame',
    description: 'Com o pedido médico em mãos',
    icon: 'flask-outline',
    fg: '#0F766E',
    bg: '#CCFBF1',
    href: { pathname: '/saude/agendar', params: { kind: 'EXAM' } },
    feature: 'agendar exames',
  },
  {
    key: 'mine',
    label: 'Meus agendamentos',
    description: 'Remarcar, cancelar e lembretes',
    icon: 'list-outline',
    fg: '#7C3AED',
    bg: '#EDE9FE',
    href: '/saude/agendamentos',
    feature: 'ver seus agendamentos',
  },
  {
    key: 'results',
    label: 'Resultados de exames',
    description: 'Laudos em PDF',
    icon: 'document-text-outline',
    fg: '#B45309',
    bg: '#FEF3C7',
    href: '/saude/exames',
    feature: 'ver resultados de exames',
  },
  {
    key: 'queue',
    label: 'Fila de especialista',
    description: 'Sua posição nos encaminhamentos',
    icon: 'people-outline',
    fg: '#1D4ED8',
    bg: '#DBEAFE',
    href: '/saude/fila',
    feature: 'acompanhar a fila de especialista',
  },
  {
    key: 'tele',
    label: 'Teleconsulta',
    description: 'Triagem online para casos simples',
    icon: 'videocam-outline',
    fg: '#BE185D',
    bg: '#FCE7F3',
    href: '/saude/teleconsulta',
    feature: 'pedir teleconsulta',
  },
];

export default function HealthServiceScreen() {
  const isVisitante = useIsVisitante();
  const [referenceUnit, setReferenceUnitState] = useState<HealthUnit | null>(null);
  const [removingRef, setRemovingRef] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<HealthUnit | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isVisitante) return;
      let active = true;
      getReferenceUnit().then(
        (unit) => active && setReferenceUnitState(unit),
        () => undefined,
      );
      return () => {
        active = false;
      };
    }, [isVisitante]),
  );

  const go = (action: Action) => {
    if (isVisitante) {
      promptVisitanteLogin(action.feature);
      return;
    }
    router.push(action.href);
  };

  const onRemoveReference = () => {
    if (!referenceUnit || removingRef) return;
    Alert.alert(
      'Remover UBS de referência',
      `Deseja remover ${referenceUnit.name} como sua UBS de referência?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setRemovingRef(true);
            clearReferenceUnit()
              .then(() => setReferenceUnitState(null))
              .catch((err: unknown) => {
                const message =
                  err instanceof Error ? err.message : 'Não foi possível remover a UBS.';
                Alert.alert('Erro', message);
              })
              .finally(() => setRemovingRef(false));
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Saúde" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <HealthCarousel />

        {!isVisitante ? (
          <Card style={styles.refCard}>
            <Pressable
              style={styles.refMain}
              onPress={() =>
                router.push({
                  pathname: '/saude/agendar',
                  params: { kind: 'CONSULTATION', chooseReference: '1' },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={
                referenceUnit
                  ? `Minha UBS: ${referenceUnit.name}. Toque para alterar`
                  : 'Definir minha UBS de referência'
              }
            >
              <View style={styles.refIcon}>
                <Ionicons name="home-outline" size={22} color={ps.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.refLabel}>Minha UBS de referência</Text>
                {referenceUnit ? (
                  <>
                    <Text style={styles.refName}>{referenceUnit.name}</Text>
                    {referenceUnit.address ? (
                      <InfoRow icon="location-outline" text={referenceUnit.address} />
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.refHint}>Toque para escolher a UBS que atende você</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>

            {referenceUnit ? (
              <Pressable
                onPress={onRemoveReference}
                disabled={removingRef}
                style={({ pressed }) => [
                  styles.removeRefBtn,
                  pressed && styles.pressed,
                  removingRef && styles.removeRefDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Remover UBS de referência"
              >
                <Ionicons name="close-circle-outline" size={18} color="#B91C1C" />
                <Text style={styles.removeRefText}>
                  {removingRef ? 'Removendo…' : 'Remover UBS de referência'}
                </Text>
              </Pressable>
            ) : null}
          </Card>
        ) : null}

        <View>
          <SectionTitle title="Serviços" />
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => go(action)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityHint={action.description}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={22} color={action.fg} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDescription} numberOfLines={2}>
                  {action.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/saude/unidades')}
          style={({ pressed }) => [styles.cnesCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Unidades de Saúde Próximas"
        >
          <View style={styles.refIcon}>
            <Ionicons name="medkit-outline" size={22} color={ps.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.refName}>Unidades de Saúde Próximas</Text>
            <Text style={styles.refHint}>
              UBS, hospitais e demais estabelecimentos do CNES neste município. Não é agendamento.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </Pressable>

        <HealthFacilities onSelect={setSelectedUnit} />
      </ScrollView>

      <HealthUnitProfileSheet
        visible={selectedUnit != null}
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ps.surface },
  flex: { flex: 1, gap: 2 },
  content: { padding: 16, gap: 20, paddingBottom: 40, backgroundColor: ps.page },
  refCard: {
    gap: 0,
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },
  refMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  cnesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },
  refIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refLabel: { fontSize: 12, fontWeight: '700', color: ps.primary, textTransform: 'uppercase' },
  refName: { fontSize: 15, fontWeight: '700', color: ps.title },
  refHint: { fontSize: 14, color: ps.body },
  removeRefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  removeRefDisabled: { opacity: 0.6 },
  removeRefText: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: {
    width: '47%',
    flexGrow: 1,
    gap: 6,
    backgroundColor: ps.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ps.border,
    padding: 14,
    minHeight: 120,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: ps.title },
  actionDescription: { fontSize: 12, color: ps.muted, lineHeight: 16 },
  pressed: { opacity: 0.7 },
});
