import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ModalWorksInProgressProps {
  visible: boolean;
  onClose: () => void;
}

const STATS = [
  { value: '24', label: 'ativas' },
  { value: '7', label: 'fase final' },
  { value: '3', label: 'iniciadas nesta semana' },
];

export function ModalWorksInProgress({ visible, onClose }: ModalWorksInProgressProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTouchableArea} onPress={onClose} />

        <View style={styles.modalCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="business-outline" size={24} color="#334155" />
                </View>
                <Text style={styles.title}>Obras em andamento</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ATUALIZADO HOJE</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {STATS.map((stat) => (
                <View key={stat.label} style={styles.statBox}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.description}>
              Acompanhe as obras por bairro, status e prazo estimado.
            </Text>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.mapButton}
              activeOpacity={0.8}
              disabled
            >
              <Ionicons name="map-outline" size={20} color="#6B7280" />
              <Text style={styles.mapButtonText}>Ver no mapa (em breve)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeGradientWrapper}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#06b6d4', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropTouchableArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DAF4F9',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgb(248 250 252 / var(--tw-bg-opacity))',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.gray[500],
    lineHeight: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: AppColors.gray[500],
    lineHeight: 20,
    marginBottom: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  closeGradientWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
