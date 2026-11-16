import LostAnimalsSection from '@/components/animals/LostAnimalsSection';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ModalAnimalsProps {
  visible: boolean;
  onClose: () => void;
}

const ONG_CONTACTS = [
  {
    id: 'meio-ambiente',
    title: 'Secretaria de Meio Ambiente',
    subtitle: 'Maus-tratos, resgate e orientação ambiental',
    phone: '2137362050',
    phoneLabel: '(21) 3736-2050',
  },
  {
    id: 'zoonoses',
    title: 'Centro de Zoonoses / Bem-estar Animal',
    subtitle: 'Vacinação, castração e acolhimento',
    phone: '2137369000',
    phoneLabel: '(21) 3736-9000',
  },
] as const;

export function ModalAnimals({ visible, onClose }: ModalAnimalsProps) {
  const [contactsOpen, setContactsOpen] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Animais e Meio Ambiente
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.body}>
          <Pressable
            onPress={() => setContactsOpen(true)}
            style={({ pressed }) => [styles.channelsChip, pressed && styles.channelsChipPressed]}
            accessibilityRole="button"
            accessibilityLabel="Abrir canais oficiais"
          >
            <View style={styles.channelsChipIcon}>
              <Ionicons name="call-outline" size={16} color="#059669" />
            </View>
            <Text style={styles.channelsChipText} numberOfLines={1}>
              Canais oficiais · Meio Ambiente e Zoonoses
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </Pressable>

          <View style={styles.listWrap}>
            <LostAnimalsSection />
          </View>
        </View>

        <Modal
          visible={contactsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setContactsOpen(false)}
        >
          <View style={styles.sheetBackdrop}>
            <Pressable style={styles.sheetDismiss} onPress={() => setContactsOpen(false)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Canais oficiais</Text>
              <Text style={styles.sheetSubtitle}>
                Para maus-tratos, resgate ou orientação em Maricá
              </Text>

              {ONG_CONTACTS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void Linking.openURL(`tel:${item.phone}`)}
                  style={({ pressed }) => [
                    styles.contactCard,
                    pressed && styles.contactCardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Ligar para ${item.title}`}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons name="call-outline" size={18} color="#059669" />
                  </View>
                  <View style={styles.contactText}>
                    <Text style={styles.contactName}>{item.title}</Text>
                    <Text style={styles.contactSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.contactPhone}>{item.phoneLabel}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </Pressable>
              ))}

              <Pressable
                onPress={() => setContactsOpen(false)}
                style={({ pressed }) => [styles.sheetCloseBtn, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Text style={styles.sheetCloseText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

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
    paddingHorizontal: 8,
    minHeight: 44,
    backgroundColor: AppColors.background.default,
  },
  headerBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPressed: { opacity: 0.7 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  headerSpacer: { width: 40 },
  body: {
    flex: 1,
    paddingTop: 4,
    gap: 8,
  },
  channelsChip: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#a7f3d0',
  },
  channelsChipPressed: {
    opacity: 0.85,
  },
  channelsChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelsChipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
  },
  listWrap: {
    flex: 1,
    minHeight: 0,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  contactCardPressed: {
    opacity: 0.85,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  contactSubtitle: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  sheetCloseBtn: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  sheetCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
});
