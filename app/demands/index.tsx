import { DemandsView } from '@/components/DemandsView';
import { WorksInProgressView } from '@/components/WorksInProgressView';
import { AppColors } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Segment = 'done' | 'works';

const segments: { key: Segment; label: string }[] = [
  { key: 'done', label: 'Entregues' },
  { key: 'works', label: 'Obras em andamento' },
];

/** Realizações: o que já foi entregue e as obras em andamento. */
export default function DemandsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [segment, setSegment] = useState<Segment>(params.tab === 'works' ? 'works' : 'done');

  return (
    <View style={styles.container}>
      <View style={styles.segmentWrap} accessibilityRole="tablist">
        {segments.map((s) => {
          const active = s.key === segment;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSegment(s.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.content}>{segment === 'done' ? <DemandsView /> : <WorksInProgressView />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  segmentTextActive: { color: AppColors.primary },
  content: { flex: 1 },
});
