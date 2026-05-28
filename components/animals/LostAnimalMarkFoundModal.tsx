import { lostAnimalTitle, type LostAnimalDto } from '@/components/animals/lostAnimalUtils';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface LostAnimalMarkFoundModalProps {
  item: LostAnimalDto | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LostAnimalMarkFoundModal({
  item,
  loading,
  onClose,
  onConfirm,
}: LostAnimalMarkFoundModalProps) {
  if (!item) return null;

  const title = lostAnimalTitle(item);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={loading ? undefined : onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#059669', '#10b981']}
              style={styles.iconGradient}
            >
              <Ionicons name="checkmark-circle" size={36} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Marcar como encontrado?</Text>
          <Text style={styles.subtitle}>
            Confirme apenas se o animal já foi localizado com segurança.
          </Text>

          <View style={styles.messageBox}>
            <Text style={styles.messageBoxLabel}>O que vai acontecer</Text>
            <Text style={styles.messageBoxText}>
              O aviso de{' '}
              <Text style={styles.messageBoxHighlight}>{title}</Text> sai da aba Perdidos e passa
              para Encontrados. Quem viu o post saberá que o animal já foi achado.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}
            >
              <Text style={styles.cancelBtnText}>Ainda não</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [styles.confirmWrap, pressed && styles.btnPressed]}
            >
              <LinearGradient
                colors={['#059669', '#10b981']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.confirmBtn, loading && styles.btnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.confirmBtnText}>Sim, foi encontrado</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    marginBottom: 14,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  messageBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  messageBoxText: {
    fontSize: 14,
    color: '#134e4a',
    lineHeight: 21,
  },
  messageBoxHighlight: {
    fontWeight: '800',
    color: '#065f46',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  confirmWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
