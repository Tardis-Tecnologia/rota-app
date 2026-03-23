import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ModalAnimalsProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalAnimals({ visible, onClose }: ModalAnimalsProps) {
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="paw" size={24} color="#047857" />
              </View>
              <Text style={styles.title}>Animais</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#059669"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Para maus-tratos, resgate ou orientação, procure a{' '}
              <Text style={styles.infoTextBold}>Secretaria do Meio Ambiente</Text>{' '}
              da sua cidade ou uma{' '}
              <Text style={styles.infoTextBold}>ONG de proteção animal</Text> local.
              Veja também o site da prefeitura.
            </Text>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={styles.closeGradientWrapper}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#22c55e', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.closeButtonGradient}
            >
              <Text style={styles.closeButtonText}>Entendi</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    backgroundColor: '#D1FAE5',
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
  closeButton: {
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F7F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  infoTextBold: {
    fontWeight: '700',
    color: '#111827',
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
