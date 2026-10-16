import {
  Badge,
  Card,
  Chip,
  InfoRow,
  PrimaryButton,
  StateView,
  ps,
} from '@/components/publicServices/ui';
import { useIsVisitante } from '@/hooks/useIsVisitante';
import {
  enrollInCourse,
  getCourses,
  leaveCourse,
  type Course,
} from '@/services/educationApi';
import { isoDateToBr } from '@/services/publicServicesHttp';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

function period(course: Course): string | null {
  if (course.startDate && course.endDate) {
    return `${isoDateToBr(course.startDate)} a ${isoDateToBr(course.endDate)}`;
  }
  if (course.startDate) return `Início em ${isoDateToBr(course.startDate)}`;
  return null;
}

export default function CoursesSection() {
  const isVisitante = useIsVisitante();
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // 'ALL', 'MINE' ou o nome de uma categoria.
  const [filter, setFilter] = useState<string>('ALL');

  const categories = useMemo(
    () =>
      [...new Set(items.map((c) => c.category?.trim()).filter((c): c is string => !!c))].sort(
        (a, b) => a.localeCompare(b, 'pt-BR'),
      ),
    [items],
  );

  const visible = useMemo(() => {
    if (filter === 'ALL') return items;
    if (filter === 'MINE') return items.filter((c) => c.enrolled);
    return items.filter((c) => c.category?.trim() === filter);
  }, [items, filter]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await getCourses());
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

  const toggle = async (course: Course) => {
    if (isVisitante) {
      promptVisitanteLogin('se inscrever em cursos');
      return;
    }
    setBusyId(course.id);
    try {
      if (course.enrolled) {
        await leaveCourse(course.id);
        setItems((prev) =>
          prev.map((c) =>
            c.id === course.id
              ? { ...c, enrolled: false, enrolledCount: c.enrolledCount - 1, seatsLeft: c.seatsLeft + 1 }
              : c,
          ),
        );
      } else {
        const updated = await enrollInCourse(course.id);
        setItems((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
        Alert.alert('Inscrição feita', `Você está inscrito em "${course.title}".`);
      }
    } catch (e) {
      Alert.alert('Não foi possível concluir', e instanceof Error ? e.message : '');
      void load(true);
    } finally {
      setBusyId(null);
    }
  };

  const confirmLeave = (course: Course) => {
    Alert.alert('Cancelar inscrição', `Deseja sair do curso "${course.title}"?`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar inscrição', style: 'destructive', onPress: () => void toggle(course) },
    ]);
  };

  if (loading || error || items.length === 0) {
    return (
      <StateView
        loading={loading}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyIcon="book-outline"
        emptyTitle="Nenhum curso aberto no momento"
        emptyMessage="Os cursos gratuitos da prefeitura aparecem aqui quando as inscrições abrirem."
        onRetry={() => void load()}
      />
    );
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.intro}>
            Cursos gratuitos e profissionalizantes da prefeitura: EJA, informática, idiomas e mais.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.chips}>
            <Chip label="Todos" selected={filter === 'ALL'} onPress={() => setFilter('ALL')} />
            <Chip label="Meus cursos" selected={filter === 'MINE'} onPress={() => setFilter('MINE')} />
            {categories.map((c) => (
              <Chip key={c} label={c} selected={filter === c} onPress={() => setFilter(c)} />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <StateView
          empty
          emptyIcon="book-outline"
          emptyTitle={filter === 'MINE' ? 'Você ainda não se inscreveu' : 'Nenhum curso nesta categoria'}
        />
      }
      renderItem={({ item }) => {
        const full = item.seatsLeft <= 0 && !item.enrolled;
        const when = period(item);
        return (
          <Card style={styles.card}>
            <View style={styles.top}>
              <View style={styles.titleWrap}>
                {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
                <Text style={styles.title}>{item.title}</Text>
              </View>
              {item.enrolled ? (
                <Badge label="Inscrito" tone="success" />
              ) : full ? (
                <Badge label="Esgotado" tone="danger" />
              ) : (
                <Badge label={`${item.seatsLeft} vagas`} tone="info" />
              )}
            </View>

            {item.description ? (
              <Text style={styles.description} numberOfLines={4}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.infos}>
              {when ? <InfoRow icon="calendar-outline" text={when} /> : null}
              {item.schedule ? <InfoRow icon="time-outline" text={item.schedule} /> : null}
              {item.location ? <InfoRow icon="location-outline" text={item.location} /> : null}
              {item.workloadHours ? (
                <InfoRow icon="hourglass-outline" text={`${item.workloadHours} horas`} />
              ) : null}
            </View>

            {item.enrolled ? (
              <PrimaryButton
                label="Cancelar inscrição"
                variant="danger"
                loading={busyId === item.id}
                onPress={() => confirmLeave(item)}
              />
            ) : (
              <PrimaryButton
                label={full ? 'Sem vagas' : 'Quero me inscrever'}
                disabled={full}
                loading={busyId === item.id}
                onPress={() => void toggle(item)}
              />
            )}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 12 },
  intro: { fontSize: 14, color: ps.muted, lineHeight: 20 },
  hScroll: { flexGrow: 0 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  card: { gap: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleWrap: { flex: 1, gap: 2 },
  category: { fontSize: 12, fontWeight: '700', color: ps.primary, textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '700', color: ps.title },
  description: { fontSize: 14, color: ps.body, lineHeight: 20 },
  infos: { gap: 6 },
});
