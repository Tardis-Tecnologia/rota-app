import LostAnimalsSection from '@/components/animals/LostAnimalsSection';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ModalAnimalsProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalAnimals({ visible, onClose }: ModalAnimalsProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrapper}>
              <Ionicons name="paw" size={24} color="#047857" />
            </View>
            <Text style={styles.title}>Animais — Meio Ambiente / ONG</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#059669"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Para maus-tratos, resgate ou orientação, procure a{' '}
              <Text style={styles.infoTextBold}>Secretaria do Meio Ambiente</Text> da sua cidade ou
              uma <Text style={styles.infoTextBold}>ONG de proteção animal</Text> local.
            </Text>
          </View>

          <LostAnimalsSection />
        </View>

        <VisitanteLoginOverlay message="Para publicar ou curtir avistamentos, faça login com uma conta cadastrada." />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF3',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  closeButton: { padding: 4 },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoIcon: { marginRight: 10, marginTop: 2 },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  infoTextBold: {
    fontWeight: '700',
    color: '#111827',
  },
});
