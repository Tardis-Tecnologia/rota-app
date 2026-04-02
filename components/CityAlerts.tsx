import { AppColors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import {
  type EmergencyAlertItem,
  getEmergencyAlerts,
} from '@/services/emergencyAlertApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/** Valores exatos de `level` no banco: critico | atencao | informativo */
function iconForAlertLevel(level: string): React.ComponentProps<typeof Ionicons>['name'] {
  const key = level.trim().toLowerCase();
  switch (key) {
    case 'critico':
      return 'warning-outline';
    case 'atencao':
      return 'alert-circle-outline';
    case 'informativo':
      return 'information-circle-outline';
    default:
      return 'information-circle-outline';
  }
}

export default function CityAlerts() {
  const { backgroundColor: brandColor } = useAppTheme();
  const [alerta, setAlerta] = useState<EmergencyAlertItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmergencyAlerts();
      setAlerta(data[0] ?? null);
    } catch {
      setAlerta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alertas da Cidade</Text>
        </View>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={AppColors.primary} />
        </View>
      </View>
    );
  }

  if (!alerta) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas da Cidade</Text>
      </View>

      <View style={[styles.alertCard, { backgroundColor: brandColor }]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconForAlertLevel(alerta.level)}
            size={32}
            color={AppColors.text.white}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.alertTitulo, !alerta.description && styles.alertTituloOnly]}
          >
            {alerta.title}
          </Text>
          {alerta.description ? (
            <Text style={styles.alertDescricao}>{alerta.description}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  loadingRow: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 24,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  alertTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text.white,
    marginBottom: 4,
  },
  alertTituloOnly: {
    marginBottom: 0,
  },
  alertDescricao: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.88)',
  },
});
