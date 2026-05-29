import { AppColors } from '@/constants/theme';
import { createUrbanReport, type UrbanReportCategory } from '@/services/urbanReportsApi';
import { formatBrazilPhoneInput } from '@/utils/phoneMask';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
    Alert,
    Dimensions,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalReportPrefeituraProps {
  visible: boolean;
  onClose: () => void;
  initialAssunto?: string;
}

const SHEET_HEIGHT_RATIO = 0.5;

const CATEGORIAS = [
  { id: '', label: 'Selecione uma categoria' },
  { id: 'iluminacao', label: 'Iluminação pública' },
  { id: 'via', label: 'Via pública / buracos' },
  { id: 'limpeza', label: 'Limpeza urbana' },
  { id: 'transito', label: 'Trânsito / sinalização' },
  { id: 'parques', label: 'Parques e praças' },
  { id: 'outros', label: 'Outros' },
];

function mapCategoriaToUrbanReportCategory(categoriaId: string): UrbanReportCategory {
  switch (categoriaId) {
    case 'iluminacao':
      return 'LIGHTING';
    case 'via':
      return 'STREET';
    case 'limpeza':
      return 'WASTE';
    case 'transito':
      return 'TRAFFIC';
    case 'parques':
      return 'OTHER';
    case 'outros':
    default:
      return 'OTHER';
  }
}

export function ModalReportPrefeitura({
  visible,
  onClose,
  initialAssunto,
}: ModalReportPrefeituraProps) {
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get('window').height;
  const sheetMaxHeight = useMemo(
    () =>
      Math.min(
        windowHeight * SHEET_HEIGHT_RATIO,
        windowHeight - insets.top - 12,
      ),
    [windowHeight, insets.top],
  );
  const sheetPaddingBottom = Math.max(insets.bottom, 20) + 8;
  const scrollMaxHeight = sheetMaxHeight - 24 - sheetPaddingBottom;

  const [nome, setNome] = React.useState('');
  const [telefone, setTelefone] = React.useState('');
  const [imagem, setImagem] = React.useState<string | null>(null);
  const [assunto, setAssunto] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [categoriaId, setCategoriaId] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const successOpacity = useSharedValue(0);
  const successScale = useSharedValue(0.8);

  useEffect(() => {
    if (!visible) {
      setIsSubmitted(false);
      setNome('');
      setTelefone('');
      setImagem(null);
      setAssunto('');
      setDescricao('');
      setCategoriaId('');
      setDropdownOpen(false);
      return;
    }
    setIsSubmitted(false);
    setNome('');
    setTelefone('');
    setImagem(null);
    setAssunto(initialAssunto ?? '');
    setDescricao('');
    setCategoriaId('');
    setDropdownOpen(false);
  }, [visible, initialAssunto]);

  useEffect(() => {
    if (isSubmitted) {
      successOpacity.value = withTiming(1, { duration: 200 });
      successScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    } else {
      successOpacity.value = 0;
      successScale.value = 0.8;
    }
  }, [isSubmitted]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    const title = assunto.trim();
    const desc = descricao.trim();
    if (!title) {
      Alert.alert('Assunto obrigatório', 'Informe um assunto para o chamado.');
      return;
    }
    if (!categoriaId.trim()) {
      Alert.alert('Categoria obrigatória', 'Selecione uma categoria para o chamado.');
      return;
    }
    if (!desc) {
      Alert.alert('Descrição obrigatória', 'Descreva o problema com o máximo de detalhes possível.');
      return;
    }

    const contactName = nome.trim();
    const contactPhone = telefone.trim();
    if (!contactName) {
      Alert.alert('Nome obrigatório', 'Informe seu nome para contato.');
      return;
    }
    if (!contactPhone) {
      Alert.alert('Telefone obrigatório', 'Informe um telefone para contato.');
      return;
    }

    setSubmitting(true);
    try {
      await createUrbanReport(
        {
          title,
          description: desc,
          contactName,
          contactPhone,
          category: mapCategoriaToUrbanReportCategory(categoriaId),
        },
        { imageUri: imagem },
      );
      setIsSubmitted(true);
    } catch (e) {
      Alert.alert(
        'Não foi possível enviar',
        e instanceof Error ? e.message : 'Tente novamente em instantes.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [assunto, categoriaId, descricao, imagem, nome, submitting, telefone]);

  const handleClose = () => {
    setIsSubmitted(false);
    setNome('');
    setTelefone('');
    setImagem(null);
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

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Para escolher uma foto, permita o acesso à galeria nas configurações do aparelho.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImagem(result.assets[0].uri);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Para tirar uma foto, permita o uso da câmera nas configurações do aparelho.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImagem(result.assets[0].uri);
    }
  }, []);

  const onTelefoneChange = useCallback((text: string) => {
    setTelefone(formatBrazilPhoneInput(text));
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTouchableArea} onPress={handleClose} />

        <View style={[styles.bottomSheet, { maxHeight: sheetMaxHeight, paddingBottom: sheetPaddingBottom }]}>
          {!isSubmitted ? (
            <ScrollView
              style={{ maxHeight: scrollMaxHeight }}
              showsVerticalScrollIndicator
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
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

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Nome</Text>
                <TextInput
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Ex: João da Silva"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  maxLength={255}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Telefone</Text>
                <TextInput
                  value={telefone}
                  onChangeText={onTelefoneChange}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={15}
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Imagem (opcional)</Text>
                <Text style={styles.fieldHint}>
                  Escolha uma foto da galeria ou tire na hora para anexar ao relatório.
                </Text>
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.imageActionButton}
                    onPress={pickFromGallery}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="images-outline" size={22} color="#0891b2" />
                    <Text style={styles.imageActionButtonText}>Galeria</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.imageActionButton}
                    onPress={takePhoto}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera-outline" size={22} color="#0891b2" />
                    <Text style={styles.imageActionButtonText}>Câmera</Text>
                  </TouchableOpacity>
                </View>
                {imagem ? (
                  <View style={styles.imagePreviewBox}>
                    <Image
                      source={{ uri: imagem }}
                      style={styles.imagePreview}
                      contentFit="cover"
                      transition={200}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImagem(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Remover imagem"
                    >
                      <Ionicons name="close-circle" size={28} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
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
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <>
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Enviando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Enviar relatório</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <Animated.View style={[styles.successContainer, successAnimatedStyle]}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={44} color={AppColors.text.white} />
              </View>
              <Text style={styles.successMessage}>Relatório enviado à prefeitura!</Text>
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
    paddingBottom: 28,
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
  fieldHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  imageActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0e7490',
  },
  imagePreviewBox: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  imagePreview: {
    width: '100%',
    height: 180,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
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
