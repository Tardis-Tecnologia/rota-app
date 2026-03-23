import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ModalReportPrefeituraProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIAS = [
  { id: '', label: 'Selecione uma categoria' },
  { id: 'iluminacao', label: 'Iluminação pública' },
  { id: 'via', label: 'Via pública / buracos' },
  { id: 'limpeza', label: 'Limpeza urbana' },
  { id: 'transito', label: 'Trânsito / sinalização' },
  { id: 'parques', label: 'Parques e praças' },
  { id: 'outros', label: 'Outros' },
];

export function ModalReportPrefeitura({ visible, onClose }: ModalReportPrefeituraProps) {
  const [assunto, setAssunto] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [categoriaId, setCategoriaId] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const successOpacity = useSharedValue(0);
  const successScale = useSharedValue(0.8);

  useEffect(() => {
    if (!visible) {
      setIsSubmitted(false);
      setAssunto('');
      setDescricao('');
      setCategoriaId('');
      setDropdownOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    if (isSubmitted) {
      successOpacity.value = withTiming(1, { duration: 200 });
      successScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    } else {
      successOpacity.value = 0;
      successScale.value = 0.8;
    }
  }, [isSubmitted]);

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setAssunto('');
    setDescricao('');
    setCategoriaId('');
    onClose();
  };

  const selectedCategoria = CATEGORIAS.find((c) => c.id === categoriaId) ?? CATEGORIAS[0];
  const isPlaceholder = !categoriaId;

  const successAnimatedStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTouchableArea} onPress={handleClose} />

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Reportar à Prefeitura</Text>
            <Text style={styles.sheetSubtitle}>
              Envie sua solicitação, reclamação ou sugestão para a prefeitura.
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {!isSubmitted ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Assunto</Text>
                <TextInput
                  value={assunto}
                  onChangeText={setAssunto}
                  placeholder="Ex: Poste queimado na Rua das Flores"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>

              <View style={[styles.formGroup, dropdownOpen && styles.formGroupDropdownOpen]}>
                <Text style={styles.fieldLabel}>Categoria</Text>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    style={[styles.dropdown, dropdownOpen && styles.dropdownFocused]}
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.dropdownText, isPlaceholder && styles.dropdownPlaceholder]}
                    >
                      {selectedCategoria.label}
                    </Text>
                    <Ionicons
                      name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {dropdownOpen && (
                    <View style={styles.dropdownList}>
                      {CATEGORIAS.map((cat) => {
                        const isSelected = categoriaId === cat.id;
                        return (
                          <TouchableOpacity
                            key={cat.id || 'placeholder'}
                            style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                            onPress={() => {
                              setCategoriaId(cat.id);
                              setDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                isSelected && styles.dropdownItemTextSelected,
                              ]}
                            >
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Descrição</Text>
                <TextInput
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Descreva o problema ou sugestão com o máximo de detalhes possível (local, horário, etc.)."
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Enviar relatório</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <Animated.View style={[styles.successContainer, successAnimatedStyle]}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={44} color={AppColors.text.white} />
              </View>
              <Text style={styles.successMessage}>
                Relatório enviado à prefeitura! +50 Pontos Cidadão 🎉
              </Text>
              <TouchableOpacity
                style={styles.closeSuccessButton}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.closeSuccessButtonText}>Fechar</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchableArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sheetHeader: {
    position: 'relative',
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    paddingRight: 40,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  formContent: {
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupDropdownOpen: {
    zIndex: 100,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownFocused: {
    borderColor: '#06b6d4',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#06b6d4',
    borderBottomColor: '#06b6d4',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeSuccessButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  closeSuccessButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
