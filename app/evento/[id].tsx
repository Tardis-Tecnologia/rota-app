import EventAttendanceSection from '@/components/events/EventAttendanceSection';
import EventCoverImage from '@/components/events/EventCoverImage';
import { AppColors } from '@/constants/theme';
import {
    getEventAttendanceCount,
    getMyEventAttendance,
    listEventParticipants,
    type EventParticipant,
    type MyEventAttendance,
} from '@/services/eventAttendancesService';
import { getEventById } from '@/services/eventsService';
import type { EventListItem } from '@/utils/eventPresentation';
import {
    eventItemToListItem,
    formatCapacityLabel,
    formatDetailDate,
    formatDetailTime,
    formatLocationLine,
    getCategoryMeta,
    organizerDisplayName,
    primaryCategoryKey,
} from '@/utils/eventPresentation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventoDetalheScreen() {
  const insets = useSafeAreaInsets();
  const { id, imageUri } = useLocalSearchParams<{ id: string; imageUri?: string }>();
  const eventId = String(id ?? '').trim();
  const imageUriFromRoute = typeof imageUri === 'string' ? imageUri.trim() : '';

  const [item, setItem] = useState<EventListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [myAttendance, setMyAttendance] = useState<MyEventAttendance | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);

  const refreshAttendance = useCallback(async () => {
    if (!eventId) return;
    try {
      const [me, countRes, parts] = await Promise.all([
        getMyEventAttendance(eventId),
        getEventAttendanceCount(eventId),
        listEventParticipants(eventId, 0, 20),
      ]);
      setMyAttendance(me);
      setAttendanceCount(countRes.count);
      setParticipants(parts);
    } catch {
      /* mantém último estado em falha parcial */
    }
  }, [eventId]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!eventId) {
        if (mounted) setAttendanceLoading(false);
        return;
      }
      setAttendanceLoading(true);
      await refreshAttendance();
      if (mounted) setAttendanceLoading(false);
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [eventId, refreshAttendance]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!eventId) {
        setError('Evento não encontrado.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getEventById(eventId);
        if (!mounted) return;
        if (!data) {
          setError('Evento não encontrado.');
          setItem(null);
        } else {
          setItem(eventItemToListItem(data));
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar evento.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const heroImageUri =
    imageUriFromRoute || item?.imagem?.trim() || undefined;

  if (loading && !heroImageUri) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.tab.active} />
      </View>
    );
  }

  if (error || (!item && !heroImageUri)) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{error ?? 'Evento não encontrado.'}</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const cat = item ? getCategoryMeta(primaryCategoryKey(item)) : null;
  const dateInfo = item ? formatDetailDate(item) : { main: '', sub: '' };
  const timeInfo = item ? formatDetailTime(item) : { main: '', sub: '' };
  const capacity = item ? formatCapacityLabel(item.capacity) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.heroWrap}>
          <EventCoverImage uri={heroImageUri} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.35)', 'rgba(15, 23, 42, 0.75)']}
            locations={[0, 0.55, 1]}
            style={styles.heroOverlay}
          />
          <View style={[styles.heroTopBar, { paddingTop: Math.max(insets.top, 12) }]}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
          {cat ? (
            <View style={styles.heroBottom}>
              <View style={[styles.catChip, { backgroundColor: cat.bg }]}>
                <Ionicons name="sparkles-outline" size={14} color={cat.color} />
                <Text style={[styles.catChipText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBody}>
            <ActivityIndicator size="small" color={AppColors.tab.active} />
          </View>
        ) : null}

        {item ? (
          <View style={styles.body}>
            <Text style={styles.title}>{item.titulo}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Ionicons name="calendar-outline" size={22} color={AppColors.tab.active} />
                <Text style={styles.infoMain}>{dateInfo.main}</Text>
                {dateInfo.sub ? <Text style={styles.infoSub}>{dateInfo.sub}</Text> : null}
              </View>
              <View style={styles.infoCell}>
                <Ionicons name="time-outline" size={22} color={AppColors.tab.active} />
                <Text style={styles.infoMain}>{timeInfo.main}</Text>
                {timeInfo.sub ? <Text style={styles.infoSub}>{timeInfo.sub}</Text> : null}
              </View>
              <View style={styles.infoCell}>
                <Ionicons name="location-outline" size={22} color={AppColors.tab.active} />
                <Text style={styles.infoMain} numberOfLines={2}>
                  {item.localNome || item.local}
                </Text>
                {item.endereco ? (
                  <Text style={styles.infoSub} numberOfLines={2}>
                    {item.endereco}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color={AppColors.tab.active} />
                <Text style={styles.sectionTitle}>Organizador</Text>
              </View>
              <View style={styles.organizerRow}>
                {item.organizadorFoto ? (
                  <Image
                    source={{ uri: item.organizadorFoto }}
                    style={styles.organizerPhoto}
                  />
                ) : (
                  <View style={styles.organizerPhotoPlaceholder}>
                    <Ionicons name="person" size={20} color={AppColors.gray[500]} />
                  </View>
                )}
                <Text style={styles.sectionText}>
                  {organizerDisplayName(item.organizador)}
                </Text>
              </View>
            </View>

            {item.descricao ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="sparkles-outline" size={18} color={AppColors.tab.active} />
                  <Text style={styles.sectionTitle}>Sobre o evento</Text>
                </View>
                <Text style={styles.sectionText}>{item.descricao}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={18} color={AppColors.tab.active} />
                <Text style={styles.sectionTitle}>Local do evento</Text>
              </View>
              <Text style={styles.sectionText}>{formatLocationLine(item)}</Text>
            </View>

            {capacity ? (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={20} color={AppColors.gray[500]} />
                  <Text style={styles.statValue}>{capacity}</Text>
                  <Text style={styles.statLabel}>Capacidade</Text>
                </View>
                {item.featured ? (
                  <View style={styles.statItem}>
                    <Ionicons name="star-outline" size={20} color={AppColors.gray[500]} />
                    <Text style={styles.statValue}>Destaque</Text>
                    <Text style={styles.statLabel}>Na agenda</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <EventAttendanceSection
              eventId={eventId}
              eventStatus={item.status ?? ''}
              capacity={item.capacity}
              attendanceCount={attendanceCount}
              myAttendance={myAttendance}
              participants={participants}
              loading={attendanceLoading}
              onRefresh={refreshAttendance}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: AppColors.background.default,
  },
  errorText: {
    fontSize: 15,
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
  backLink: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.tab.active,
  },
  heroWrap: {
    height: 280,
    backgroundColor: AppColors.gray[300],
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: AppColors.gray[300],
  },
  loadingBody: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    zIndex: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.text.secondary,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCell: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    alignItems: 'center',
  },
  infoMain: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  infoSub: {
    fontSize: 11,
    color: AppColors.gray[500],
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  sectionText: {
    fontSize: 15,
    color: AppColors.text.tertiary,
    lineHeight: 22,
    flex: 1,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  organizerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.gray[200],
  },
  organizerPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.gray[500],
  },
});
