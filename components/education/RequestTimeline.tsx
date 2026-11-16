import { AppColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type TimelineStep = {
  id: string;
  title: string;
  description?: string;
  date?: string;
  done: boolean;
  current?: boolean;
};

export default function RequestTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={step.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  step.done && styles.dotDone,
                  step.current && styles.dotCurrent,
                ]}
              />
              {!isLast ? <View style={[styles.line, step.done && styles.lineDone]} /> : null}
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{step.title}</Text>
              {step.description ? <Text style={styles.desc}>{step.description}</Text> : null}
              {step.date ? <Text style={styles.date}>{step.date}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  row: { flexDirection: 'row', gap: 12, minHeight: 56 },
  rail: { width: 16, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    marginTop: 4,
  },
  dotDone: { backgroundColor: AppColors.primary },
  dotCurrent: {
    backgroundColor: '#f59e0b',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  lineDone: { backgroundColor: '#93c5fd' },
  content: { flex: 1, paddingBottom: 16 },
  title: { fontSize: 14, fontWeight: '700', color: AppColors.text.secondary },
  desc: { marginTop: 2, fontSize: 13, color: AppColors.text.tertiary, lineHeight: 18 },
  date: { marginTop: 4, fontSize: 11, color: AppColors.text.quaternary },
});
