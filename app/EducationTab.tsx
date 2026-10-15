import EnrollmentsComponent, { mockEnrollments } from '@/components/EnrollmentsComponent';
import ModalCompleteEnrollment from '@/components/ModalCompleteEnrollment';
import SearchEnrollmentComponent from '@/components/SearchEnrollmentComponent';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EducationTabKey = 'search' | 'enrollments';

export default function EducationTab() {
  const [activeTab, setActiveTab] = useState<EducationTabKey>('search');
  const [selectedEnrollment, setSelectedEnrollment] = useState<typeof mockEnrollments[number] | null>(null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Educação</Text>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'search' && styles.tabButtonActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[styles.tabLabel, activeTab === 'search' && styles.tabLabelActive]}>
              Fazer Matrícula
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'enrollments' && styles.tabButtonActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('enrollments')}
          >
            <Text style={[styles.tabLabel, activeTab === 'enrollments' && styles.tabLabelActive]}>
              Minhas Matrículas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'search' ? (
          <SearchEnrollmentComponent />
        ) : (
          <EnrollmentsComponent onSelectEnrollment={setSelectedEnrollment} />
        )}
      </View>

      {selectedEnrollment && (
        <View style={styles.modalOverlay}>
          <ModalCompleteEnrollment
            onClose={() => setSelectedEnrollment(null)}
            onSubmit={() => setSelectedEnrollment(null)}
            initialData={{ studentName: selectedEnrollment.studentName }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  header: {
    backgroundColor: AppColors.background.overlay,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.overlay,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
    paddingHorizontal: 16,
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: AppColors.accent,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  tabLabelActive: {
    color: AppColors.accent,
  },
  content: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },
});