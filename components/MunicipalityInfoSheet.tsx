import { AppColors } from '@/constants/theme';
import type { MunicipalTerritory } from '@/services/territorialApi';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

type MunicipalityInfoSheetProps = {
  visible: boolean;
  loading: boolean;
  info: MunicipalTerritory | null;
  error: string;
  boundaryOn: boolean;
  onToggleBoundary: (value: boolean) => void;
  onClose: () => void;
};

export default function MunicipalityInfoSheet({
  visible,
  loading,
  info,
  error,
  boundaryOn,
  onToggleBoundary,
  onClose,
}: MunicipalityInfoSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Dados do município</Text>
          {loading ? <ActivityIndicator color={AppColors.primary} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? (
            <>
              {info.notice ? <Text style={styles.notice}>{info.notice}</Text> : null}
              <Text style={styles.city}>{info.municipalityName}{info.uf ? ` · ${info.uf}` : ''}</Text>
              <Row label="Código IBGE" value={info.ibgeCode || 'Dado indisponível'} />
              <Row label="População" value={info.population ? `${info.population.display} · ${info.population.year || 'sem ano'}` : 'Dado indisponível'} />
              <Row label="Área territorial" value={info.area ? `${info.area.display} · ${info.area.year || 'sem ano'}` : 'Dado indisponível'} />
              <Row label="Fonte" value="IBGE" />
              <Row label="Ocorrências públicas no ROTA" value={info.publicOccurrences == null ? 'Dado indisponível' : String(info.publicOccurrences)} />
              <Row label="Região imediata" value={info.immediateRegion || 'Dado indisponível'} />
              <View style={styles.toggleRow}>
                <Text style={styles.rowLabel}>Limite municipal no mapa</Text>
                <Switch value={boundaryOn} onValueChange={onToggleBoundary} />
              </View>
              <Text style={styles.note}>{info.sourceNote}</Text>
            </>
          ) : null}
          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 8,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  city: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  row: { gap: 2 },
  rowLabel: { fontSize: 12, color: '#64748b' },
  rowValue: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  toggleRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { marginTop: 8, fontSize: 12, color: '#475569' },
  notice: { color: '#9a3412', fontSize: 13 },
  error: { color: '#991b1b' },
  close: { marginTop: 8, alignSelf: 'flex-start' },
  closeText: { color: AppColors.primary, fontWeight: '700' },
});
