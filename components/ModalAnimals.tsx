import LostAnimalsSection from '@/components/animals/LostAnimalsSection';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ModalAnimalsProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalAnimals({ visible, onClose }: ModalAnimalsProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Animais perdidos
          </Text>
          <View style={styles.headerSpacer} />
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    minHeight: 44,
    backgroundColor: AppColors.background.default,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPressed: { opacity: 0.7 },
  headerTitle: {
    position: 'absolute',
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  headerSpacer: { width: 40 },
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
