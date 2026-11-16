import { AppColors } from '@/constants/theme';
import { CALENDAR_LABEL } from '@/services/educationServicesApi';
import { mockCalendar } from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarioScreen() {
  const initial = new Date(2026, 10, 1);
  const [cursor, setCursor] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const eventsByDay = useMemo(() => {
    const map = new Map<number, typeof mockCalendar>();
    for (const event of mockCalendar) {
      const d = new Date(event.date + 'T12:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const list = map.get(day) ?? [];
        list.push(event);
        map.set(day, list);
      }
    }
    return map;
  }, [year, month]);

  const totalDays = daysInMonth(year, month);
  const startWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const selected = mockCalendar.find((e) => e.id === selectedId) ?? null;
  const monthEvents = mockCalendar.filter((e) => {
    const d = new Date(e.date + 'T12:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => setCursor(new Date(year, month - 1, 1))}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-back" size={20} color={AppColors.text.secondary} />
        </Pressable>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <Pressable
          onPress={() => setCursor(new Date(year, month + 1, 1))}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={AppColors.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          const events = day ? eventsByDay.get(day) : undefined;
          return (
            <Pressable
              key={`c-${index}`}
              style={styles.cell}
              disabled={!events?.length}
              onPress={() => events?.[0] && setSelectedId(events[0].id)}
            >
              <Text style={[styles.dayNum, events?.length ? styles.dayActive : null]}>
                {day ?? ''}
              </Text>
              {events?.length ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Eventos do mês</Text>
      {monthEvents.map((event) => (
        <Pressable key={event.id} style={styles.eventCard} onPress={() => setSelectedId(event.id)}>
          <Text style={styles.eventKind}>{CALENDAR_LABEL[event.kind] ?? event.kind}</Text>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>
            {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}
          </Text>
        </Pressable>
      ))}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelectedId(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedId(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.eventKind}>{selected ? CALENDAR_LABEL[selected.kind] : ''}</Text>
            <Text style={styles.eventTitle}>{selected?.title}</Text>
            <Text style={styles.eventDate}>
              {selected
                ? new Date(selected.date + 'T12:00:00').toLocaleDateString('pt-BR')
                : ''}
            </Text>
            <Pressable style={styles.closeBtn} onPress={() => setSelectedId(null)}>
              <Text style={styles.closeText}>Fechar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: { padding: 8, borderRadius: 999, backgroundColor: '#fff' },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text.secondary,
    textTransform: 'capitalize',
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.text.quaternary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  cell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 13, color: AppColors.text.tertiary },
  dayActive: { color: AppColors.primary, fontWeight: '800' },
  dot: {
    marginTop: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
  },
  section: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    textTransform: 'uppercase',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  eventKind: { fontSize: 11, fontWeight: '700', color: AppColors.primary },
  eventTitle: { marginTop: 4, fontSize: 14, fontWeight: '700', color: AppColors.text.secondary },
  eventDate: { marginTop: 2, fontSize: 12, color: AppColors.text.tertiary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  closeBtn: {
    marginTop: 14,
    alignSelf: 'flex-end',
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeText: { color: '#fff', fontWeight: '700' },
});
