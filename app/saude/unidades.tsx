import { ScreenHeader, ps } from '@/components/publicServices/ui';
import {
  CNES_KIND_LABEL,
  getCnesEstablishment,
  getCnesEstablishments,
  type CnesDetail,
  type CnesEstablishment,
  type CnesList,
} from '@/services/cnesApi';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const KINDS = [
  { id: '', label: 'Todos' },
  { id: 'ubs', label: 'UBS' },
  { id: 'hospital', label: 'Hospitais' },
  { id: 'other', label: 'Outros' },
] as const;

function formatWhen(value: string | null): string {
  if (!value) return 'data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

export default function NearbyHealthUnitsScreen() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState<CnesList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CnesDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback((q: string, selectedKind: string) => {
    setLoading(true);
    setError(null);
    getCnesEstablishments({ q: q.trim() || undefined, kind: selectedKind || undefined, limit: 30, offset: 0 })
      .then(setPage)
      .catch((err: unknown) => {
        setPage(null);
        setError(err instanceof Error ? err.message : 'Não foi possível consultar o CNES.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query, kind), 350);
    return () => clearTimeout(timer);
  }, [kind, load, query]);

  const openDetail = (item: CnesEstablishment) => {
    setDetailLoading(true);
    setDetail(null);
    getCnesEstablishment(item.cnes)
      .then(setDetail)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Não foi possível abrir o estabelecimento.');
      })
      .finally(() => setDetailLoading(false));
  };

  const openMap = (item: CnesEstablishment) => {
    if (item.latitude == null || item.longitude == null) return;
    router.push({
      pathname: '/(tabs)/map',
      params: {
        healthLayer: '1',
        focusLat: String(item.latitude),
        focusLng: String(item.longitude),
        focusLabel: item.name,
        focusAddress: item.address ?? item.typeName,
      },
    } as Href);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Unidades de Saúde Próximas" />
      <View style={styles.filters}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nome ou CNES"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kinds}>
          {KINDS.map((item) => (
            <Pressable
              key={item.id || 'all'}
              onPress={() => setKind(item.id)}
              style={[styles.kind, kind === item.id && styles.kindOn]}
            >
              <Text style={[styles.kindText, kind === item.id && styles.kindTextOn]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {page?.notice ? <Text style={styles.notice}>{page.notice}</Text> : null}
      {page ? (
        <Text style={styles.source}>
          {page.sourceNote} Consulta: {formatWhen(page.fetchedAt)}
          {page.status === 'stale' ? ' · dados em cache' : ''}. {page.bedsNotice}
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator color={ps.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={page?.items ?? []}
          keyExtractor={(item) => item.cnes}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum estabelecimento encontrado neste município.</Text>}
          ListFooterComponent={
            page && page.items.length < page.total ? (
              <Pressable
                style={styles.mapButton}
                disabled={loadingMore}
                onPress={() => {
                  setLoadingMore(true);
                  getCnesEstablishments({
                    q: query.trim() || undefined,
                    kind: kind || undefined,
                    limit: 30,
                    offset: page.items.length,
                  })
                    .then((next) =>
                      setPage({ ...next, items: [...page.items, ...next.items] }),
                    )
                    .catch((err: unknown) => {
                      setError(err instanceof Error ? err.message : 'Não foi possível carregar mais estabelecimentos.');
                    })
                    .finally(() => setLoadingMore(false));
                }}
              >
                <Text style={styles.mapButtonText}>{loadingMore ? 'Carregando…' : 'Carregar mais'}</Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openDetail(item)}>
              <Text style={styles.kindBadge}>{CNES_KIND_LABEL[item.kind]}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>CNES {item.cnes} · {item.typeName}</Text>
              <Text style={styles.meta}>{item.address || 'Endereço não informado pelo CNES'}</Text>
              {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
            </Pressable>
          )}
        />
      )}

      <Modal visible={detail != null || detailLoading} animationType="slide" onRequestClose={() => setDetail(null)}>
        <SafeAreaView style={styles.safe}>
          <ScreenHeader title="Estabelecimento" onBack={() => setDetail(null)} />
          {detailLoading || !detail ? (
            <ActivityIndicator color={ps.primary} style={styles.loader} />
          ) : (
            <ScrollView contentContainerStyle={styles.detail}>
              <Text style={styles.name}>{detail.name}</Text>
              <Text style={styles.meta}>CNES {detail.cnes} · {detail.typeName}</Text>
              <Text style={styles.meta}>{detail.address || 'Endereço não informado pelo CNES'}</Text>
              {detail.neighborhood ? <Text style={styles.meta}>{detail.neighborhood}</Text> : null}
              {detail.phone ? <Text style={styles.meta}>Telefone: {detail.phone}</Text> : null}
              {detail.email ? <Text style={styles.meta}>E-mail publicado no CNES: {detail.email}</Text> : null}
              {detail.shiftDescription ? <Text style={styles.meta}>{detail.shiftDescription}</Text> : null}
              <Text style={styles.section}>Serviços cadastrados</Text>
              {detail.servicesNotice ? <Text style={styles.notice}>{detail.servicesNotice}</Text> : null}
              {detail.services.length === 0 ? (
                <Text style={styles.meta}>Nenhum serviço especializado retornado para este estabelecimento.</Text>
              ) : (
                detail.services.map((service) => (
                  <Text key={`${service.serviceCode}-${service.classification}`} style={styles.meta}>
                    {service.description}
                    {service.susHospital === 'SIM' ? ' · hospitalar SUS' : ''}
                    {service.susOutpatient === 'SIM' ? ' · ambulatorial SUS' : ''}
                  </Text>
                ))
              )}
              <Text style={styles.section}>Estrutura informada</Text>
              <Text style={styles.meta}>
                {[
                  detail.hasHospitalCare ? 'atendimento hospitalar' : null,
                  detail.hasSurgicalCenter ? 'centro cirúrgico' : null,
                  detail.hasObstetricCenter ? 'centro obstétrico' : null,
                  detail.hasNeonatalCenter ? 'centro neonatal' : null,
                ].filter(Boolean).join(', ') || 'O CNES não informou estrutura hospitalar.'}
              </Text>
              <Text style={styles.notice}>
                Este cadastro não significa que há vaga ou agendamento pelo ROTA.
              </Text>
              {detail.latitude != null && detail.longitude != null ? (
                <Pressable style={styles.mapButton} onPress={() => openMap(detail)}>
                  <Ionicons name="map-outline" size={18} color="#fff" />
                  <Text style={styles.mapButtonText}>Ver no mapa</Text>
                </Pressable>
              ) : (
                <Text style={styles.meta}>O CNES não informou coordenadas para esta unidade.</Text>
              )}
              <Text style={styles.source}>
                Fonte: dados abertos do Ministério da Saúde. Atualização do cadastro:{' '}
                {detail.sourceUpdatedAt ?? 'não informada'}. Consulta: {formatWhen(detail.fetchedAt)}.
              </Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  filters: { paddingHorizontal: 16, gap: 10 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
  },
  kinds: { gap: 8, paddingBottom: 8 },
  kind: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#E2E8F0' },
  kindOn: { backgroundColor: '#0F172A' },
  kindText: { color: '#334155', fontWeight: '600' },
  kindTextOn: { color: '#fff' },
  notice: { marginHorizontal: 16, marginBottom: 8, color: '#92400E' },
  source: { marginHorizontal: 16, marginBottom: 8, color: '#64748B', fontSize: 12 },
  loader: { marginTop: 32 },
  error: { margin: 16, color: '#B91C1C' },
  list: { padding: 16, gap: 10 },
  empty: { color: '#64748B' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 4 },
  kindBadge: { color: '#0369A1', fontSize: 12, fontWeight: '700' },
  name: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  meta: { color: '#475569' },
  detail: { padding: 16, gap: 8 },
  section: { marginTop: 12, color: '#0F172A', fontWeight: '700' },
  mapButton: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapButtonText: { color: '#fff', fontWeight: '700' },
});
