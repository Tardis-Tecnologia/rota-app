import { Card, InfoRow, PrimaryButton, ScreenHeader, StateView, ps, Badge } from '@/components/publicServices/ui';
import { getExamResultLink, getMyExamResults, type ExamResult } from '@/services/healthApi';
import { isoDateToBr } from '@/services/publicServicesHttp';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExamesScreen() {
  const [items, setItems] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await getMyExamResults());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const open = async (item: ExamResult) => {
    setOpeningId(item.id);
    try {
      // Link temporário (10 min): o PDF nunca fica público.
      const { url } = await getExamResultLink(item.id);
      await WebBrowser.openBrowserAsync(url);
      setItems((prev) =>
        prev.map((r) => (r.id === item.id && !r.viewedAt ? { ...r, viewedAt: new Date().toISOString() } : r)),
      );
    } catch (e) {
      Alert.alert('Não foi possível abrir', e instanceof Error ? e.message : '');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Resultados de exames" />
      {loading || error || items.length === 0 ? (
        <StateView
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyIcon="document-text-outline"
          emptyTitle="Nenhum resultado ainda"
          emptyMessage="Quando a unidade liberar o laudo de um exame, ele aparece aqui em PDF."
          onRetry={() => void load()}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          ListHeaderComponent={
            <Text style={styles.intro}>
              Os laudos são pessoais. O link de cada PDF vale por 10 minutos.
            </Text>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.top}>
                <View style={styles.flex}>
                  <Text style={styles.exam}>{item.examName}</Text>
                  <Text style={styles.meta}>
                    {item.patientName} · {isoDateToBr(item.resultDate)}
                  </Text>
                </View>
                {!item.viewedAt ? <Badge label="Novo" tone="success" /> : null}
              </View>
              {item.unit ? <InfoRow icon="business-outline" text={item.unit.name} /> : null}
              {item.notes ? <InfoRow icon="information-circle-outline" text={item.notes} /> : null}
              <PrimaryButton
                label="Abrir PDF"
                icon="document-outline"
                variant="outline"
                loading={openingId === item.id}
                onPress={() => void open(item)}
              />
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ps.surface },
  flex: { flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 40, backgroundColor: ps.page, flexGrow: 1 },
  intro: { fontSize: 13, color: ps.muted, lineHeight: 19 },
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exam: { fontSize: 16, fontWeight: '700', color: ps.title },
  meta: { fontSize: 13, color: ps.muted, marginTop: 2 },
});
