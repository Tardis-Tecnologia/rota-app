import { buildCityGeocodeQuery } from '@/constants/whitelabelCity';
import { HEALTH_UNIT_TYPE_LABELS, type HealthUnit } from '@/services/healthApi';
import { geocodeStoreLocation } from '@/utils/commercialStoreProfile';
import { resolveActiveCityConfig } from '@/utils/whitelabelHost';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HealthUnitProfileSheetProps = {
  visible: boolean;
  unit: HealthUnit | null;
  onClose: () => void;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function unitAddressLine(unit: HealthUnit): string {
  return [unit.address, unit.neighborhood].filter(Boolean).join(' · ');
}

async function resolveUnitCoords(
  unit: HealthUnit,
): Promise<{ latitude: number; longitude: number } | null> {
  if (
    typeof unit.latitude === 'number' &&
    typeof unit.longitude === 'number' &&
    Number.isFinite(unit.latitude) &&
    Number.isFinite(unit.longitude)
  ) {
    return { latitude: unit.latitude, longitude: unit.longitude };
  }

  const base = [unit.address, unit.neighborhood].filter(Boolean).join(', ') || unit.name;
  const query = buildCityGeocodeQuery(base, resolveActiveCityConfig());
  if (!query) return null;
  return geocodeStoreLocation(query);
}

export default function HealthUnitProfileSheet({
  visible,
  unit,
  onClose,
}: HealthUnitProfileSheetProps) {
  const insets = useSafeAreaInsets();
  const [routeLoading, setRouteLoading] = useState(false);

  const phoneDigits = useMemo(
    () => (unit?.phone ? digitsOnly(unit.phone) : ''),
    [unit?.phone],
  );
  const canCall = phoneDigits.length >= 10;
  const addressLine = unit ? unitAddressLine(unit) : '';
  const hasCoords =
    typeof unit?.latitude === 'number' &&
    typeof unit?.longitude === 'number' &&
    Number.isFinite(unit.latitude) &&
    Number.isFinite(unit.longitude);
  const canOpenMap = hasCoords || Boolean(addressLine || unit?.name);

  const onCall = () => {
    if (!canCall) return;
    void Linking.openURL(`tel:${phoneDigits}`);
  };

  const onOpenMap = async () => {
    if (!unit || routeLoading) return;
    setRouteLoading(true);
    try {
      const coords = await resolveUnitCoords(unit);
      if (!coords) {
        Alert.alert(
          'Localização',
          'Não foi possível localizar esta unidade no mapa. Verifique o endereço cadastrado.',
        );
        return;
      }
      onClose();
      router.push({
        pathname: '/(tabs)/map',
        params: {
          focusLat: String(coords.latitude),
          focusLng: String(coords.longitude),
          focusLabel: unit.name,
          focusAddress: unit.address?.trim() || addressLine || '',
          traceRoute: '1',
          routeKey: String(Date.now()),
        },
      });
    } finally {
      setRouteLoading(false);
    }
  };

  if (!unit) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {HEALTH_UNIT_TYPE_LABELS[unit.type] ?? unit.type}
            </Text>
          </View>
          <Text style={styles.name}>{unit.name}</Text>

          {addressLine ? (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={18} color="#64748b" />
              <Text style={styles.rowText}>{addressLine}</Text>
            </View>
          ) : null}

          {unit.phone ? (
            <View style={styles.row}>
              <Ionicons name="call-outline" size={18} color="#64748b" />
              <Text style={styles.rowText}>{unit.phone}</Text>
            </View>
          ) : null}

          {unit.openingHours ? (
            <View style={styles.row}>
              <Ionicons name="time-outline" size={18} color="#64748b" />
              <Text style={styles.rowText}>{unit.openingHours}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onCall}
              disabled={!canCall}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.callBtn,
                !canCall && styles.actionDisabled,
                pressed && canCall && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ligar para a unidade"
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.actionText}>Ligar</Text>
            </Pressable>

            <Pressable
              onPress={() => void onOpenMap()}
              disabled={!canOpenMap || routeLoading}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.mapBtn,
                (!canOpenMap || routeLoading) && styles.actionDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Como chegar no mapa do app"
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.actionText}>
                {routeLoading ? 'Calculando…' : 'Como chegar'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '800', color: '#1D4ED8' },
  name: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#475569' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callBtn: { backgroundColor: '#059669' },
  mapBtn: { backgroundColor: '#0369a1' },
  actionDisabled: { opacity: 0.45 },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  pressed: { opacity: 0.88 },
});
