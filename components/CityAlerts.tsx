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

type AlertVisual = {
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  leftIcon: React.ComponentProps<typeof Ionicons>['name'];
  leftIconColor: string;
  rightIcon: React.ComponentProps<typeof Ionicons>['name'];
  rightIconColor: string;
};

function visualForAlertLevel(level: string): AlertVisual {
  const key = level.trim().toLowerCase();
  switch (key) {
    case 'critico':
      return {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        titleColor: '#b91c1c',
        subtitleColor: '#dc2626',
        leftIcon: 'warning',
        leftIconColor: '#dc2626',
        rightIcon: 'rainy',
        rightIconColor: '#dc2626',
      };
    case 'atencao':
      return {
        backgroundColor: '#fffbeb',
        borderColor: '#fde68a',
        titleColor: '#b45309',
        subtitleColor: '#d97706',
        leftIcon: 'alert-circle',
        leftIconColor: '#d97706',
        rightIcon: 'alert-circle-outline',
        rightIconColor: '#d97706',
      };
    default:
      return {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        titleColor: '#1d4ed8',
        subtitleColor: '#2563eb',
        leftIcon: 'information-circle',
        leftIconColor: '#2563eb',
        rightIcon: 'information-circle-outline',
        rightIconColor: '#2563eb',
      };
  }
}

export default function CityAlerts() {
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
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#dc2626" />
      </View>
    );
  }

  if (!alerta) {
    return null;
  }

  const visual = visualForAlertLevel(alerta.level);

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: visual.backgroundColor,
          borderColor: visual.borderColor,
        },
      ]}
    >
      <Ionicons name={visual.leftIcon} size={22} color={visual.leftIconColor} />
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: visual.titleColor }]} numberOfLines={2}>
          {alerta.title}
        </Text>
        {alerta.description ? (
          <Text style={[styles.subtitle, { color: visual.subtitleColor }]} numberOfLines={2}>
            {alerta.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name={visual.rightIcon} size={22} color={visual.rightIconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
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
  textCol: {
    flex: 1,
    gap: 2,
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
