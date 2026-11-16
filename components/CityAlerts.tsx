import AlertMotionIcon from '@/components/icons/AlertMotionIcon';
import {
  type EmergencyAlertItem,
  getEmergencyAlerts,
} from '@/services/emergencyAlertApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type AlertVisual = {
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  metaColor: string;
  leftIcon: React.ComponentProps<typeof Ionicons>['name'];
  leftIconColor: string;
  rightIcon: React.ComponentProps<typeof Ionicons>['name'];
  rightIconColor: string;
  levelLabel: string;
};

function iconForAlertText(
  title: string,
  description: string | null,
): React.ComponentProps<typeof Ionicons>['name'] | null {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  if (text.includes('alag')) return 'water';
  if (text.includes('temporal') || text.includes('tempestade') || text.includes('raio')) {
    return 'thunderstorm';
  }
  if (text.includes('chuva')) return 'rainy';
  return null;
}

function visualForAlertLevel(level: string): AlertVisual {
  const key = level.trim().toLowerCase();
  switch (key) {
    case 'critico':
      return {
        backgroundColor: 'rgba(254, 242, 242, 0.95)',
        borderColor: 'rgba(254, 202, 202, 0.95)',
        titleColor: '#b91c1c',
        subtitleColor: '#dc2626',
        metaColor: '#ef4444',
        leftIcon: 'warning',
        leftIconColor: '#dc2626',
        rightIcon: 'rainy',
        rightIconColor: '#dc2626',
        levelLabel: 'Crítico - Estágio vermelho',
      };
    case 'atencao':
      return {
        backgroundColor: 'rgba(255, 251, 235, 0.95)',
        borderColor: 'rgba(253, 230, 138, 0.95)',
        titleColor: '#b45309',
        subtitleColor: '#d97706',
        metaColor: '#f59e0b',
        leftIcon: 'alert-circle',
        leftIconColor: '#d97706',
        rightIcon: 'alert-circle-outline',
        rightIconColor: '#d97706',
        levelLabel: 'Atenção - Estágio amarelo',
      };
    default:
      return {
        backgroundColor: 'rgba(239, 246, 255, 0.95)',
        borderColor: 'rgba(191, 219, 254, 0.95)',
        titleColor: '#1d4ed8',
        subtitleColor: '#2563eb',
        metaColor: '#3b82f6',
        leftIcon: 'information-circle',
        leftIconColor: '#2563eb',
        rightIcon: 'information-circle-outline',
        rightIconColor: '#2563eb',
        levelLabel: 'Informativo',
      };
  }
}

function formatAlertWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Agora';
  if (mins < 60) return `Há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Há ${days} d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface CityAlertsProps {
  /** `header` ocupa o espaço antigo dos pontos no topo; `feed` fica abaixo do header */
  variant?: 'header' | 'feed';
  /** Incrementar para buscar de novo (puxar a home para atualizar). */
  reloadToken?: number;
}

async function loadAlertsWithRetry(): Promise<EmergencyAlertItem[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const data = await getEmergencyAlerts({ init: 0, end: 5 });
      return Array.isArray(data) ? data.slice(0, 5) : [];
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }
  throw lastError;
}

export default function CityAlerts({ variant = 'feed', reloadToken = 0 }: CityAlertsProps) {
  const [alertas, setAlertas] = useState<EmergencyAlertItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [autoplayEpoch, setAutoplayEpoch] = useState(0);
  const countRef = useRef(0);
  countRef.current = alertas.length;

  const goTo = useCallback((nextIndex: number) => {
    const count = countRef.current;
    if (count < 2) return;
    setIndex(((nextIndex % count) + count) % count);
    setAutoplayEpoch((epoch) => epoch + 1);
  }, []);

  const stepRef = useRef<(delta: number) => void>(() => {});
  stepRef.current = (delta: number) => {
    const count = countRef.current;
    if (count < 2) return;
    setIndex((prev) => (prev + delta + count) % count);
    setAutoplayEpoch((epoch) => epoch + 1);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        countRef.current > 1 &&
        Math.abs(gesture.dx) > 16 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -36) stepRef.current(1);
        else if (gesture.dx >= 36) stepRef.current(-1);
      },
    }),
  ).current;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadAlertsWithRetry();
      setAlertas(list);
      setIndex(0);
    } catch {
      setAlertas([]);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  useEffect(() => {
    if (alertas.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % alertas.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [alertas.length, autoplayEpoch]);

  if (loading) {
    return (
      <View style={[styles.loadingWrap, variant === 'header' && styles.loadingWrapHeader]}>
        <ActivityIndicator size="small" color={variant === 'header' ? '#fff' : '#dc2626'} />
        {variant === 'header' ? (
          <Text style={styles.loadingHeaderText}>Carregando alertas…</Text>
        ) : null}
      </View>
    );
  }

  if (alertas.length === 0) {
    if (variant !== 'header') return null;
    return (
      <View style={styles.emptyHeaderCard}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#fff" />
        <View style={styles.textCol}>
          <Text style={styles.emptyHeaderTitle}>Nenhum alerta ativo</Text>
          <Text style={styles.emptyHeaderSubtitle}>
            Acompanhe avisos de clima, trânsito e emergência por aqui
          </Text>
        </View>
      </View>
    );
  }

  const alerta = alertas[Math.min(index, alertas.length - 1)]!;
  const topicIcon = iconForAlertText(alerta.title, alerta.description);
  const visual = {
    ...visualForAlertLevel(alerta.level),
    ...(topicIcon ? { leftIcon: topicIcon, rightIcon: topicIcon } : {}),
  };
  const when = formatAlertWhen(alerta.updatedAt || alerta.createdAt);
  const hasMultiple = alertas.length > 1;
  const isHeader = variant === 'header';

  return (
    <View style={[styles.list, isHeader && styles.listHeader]}>
      <View
        {...(hasMultiple ? panResponder.panHandlers : {})}
        accessible
        accessibilityLabel={alerta.title}
        accessibilityHint={hasMultiple ? 'Deslize para o lado para ver outro alerta' : undefined}
        style={[
          styles.banner,
          isHeader && styles.bannerHeader,
          {
            backgroundColor: visual.backgroundColor,
            borderColor: visual.borderColor,
          },
        ]}
      >
        <AlertMotionIcon name={visual.leftIcon} color={visual.leftIconColor} size={26} />
        <View style={styles.textCol}>
          <View style={styles.metaRow}>
            <Text style={[styles.levelChip, { color: visual.metaColor }]} numberOfLines={2}>
              {visual.levelLabel}
            </Text>
            {when ? (
              <Text style={[styles.whenText, { color: visual.metaColor }]}>{when}</Text>
            ) : null}
          </View>
          <Text style={[styles.title, { color: visual.titleColor }]} numberOfLines={2}>
            {alerta.title}
          </Text>
          {alerta.description ? (
            <Text
              style={[styles.subtitle, { color: visual.subtitleColor }]}
              numberOfLines={isHeader ? 3 : 2}
            >
              {alerta.description}
            </Text>
          ) : null}
        </View>

        <AlertMotionIcon name={visual.rightIcon} color={visual.rightIconColor} size={30} />
      </View>
      {hasMultiple ? (
        <View
          style={[styles.dotsRow, isHeader && styles.dotsRowHeader]}
          accessibilityLabel={`Alerta ${index + 1} de ${alertas.length}`}
        >
          {alertas.map((item, dotIndex) => (
            <Pressable
              key={item.id}
              onPress={() => goTo(dotIndex)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Mostrar alerta ${dotIndex + 1}`}
              accessibilityState={{ selected: dotIndex === index }}
              style={styles.dotHit}
            >
              <View style={[styles.dot, dotIndex === index ? styles.dotActive : styles.dotIdle]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
  },
  listHeader: {
    marginTop: 10,
    gap: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dotsRowHeader: {
    paddingTop: 2,
    paddingBottom: 0,
  },
  dotHit: {
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 14,
  },
  dotIdle: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  loadingWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  loadingWrapHeader: {
    marginTop: 10,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingHeaderText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyHeaderCard: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 20,
  },
  emptyHeaderSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerHeader: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 14,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  levelChip: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  whenText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
