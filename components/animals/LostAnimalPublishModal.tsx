import {
  EMPTY_LOST_ANIMAL_FORM,
  formatBrazilDateInput,
  formatContactInput,
  hasFormErrors,
  lostAnimalDtoToFormState,
  lostAnimalImageUrl,
  validateLostAnimalForm,
  type LostAnimalDto,
  type LostAnimalFormErrors,
  type LostAnimalFormState,
} from '@/components/animals/lostAnimalUtils';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface LostAnimalPublishModalProps {
  visible: boolean;
  publishing: boolean;
  mode: 'create' | 'edit';
  editingItem?: LostAnimalDto | null;
  onClose: () => void;
  onSubmit: (form: LostAnimalFormState, imageUri: string | null) => void;
}

export default function LostAnimalPublishModal({
  visible,
  publishing,
  mode,
  editingItem,
  onClose,
  onSubmit,
}: LostAnimalPublishModalProps) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<LostAnimalFormState>(EMPTY_LOST_ANIMAL_FORM);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pickedNewPhoto, setPickedNewPhoto] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LostAnimalFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const existingPhotoUrl = useMemo(() => {
    if (!editingItem) return null;
    return lostAnimalImageUrl(editingItem);
  }, [editingItem]);

  const reset = useCallback(() => {
    setForm(EMPTY_LOST_ANIMAL_FORM);
    setImageUri(null);
    setPickedNewPhoto(false);
    setFieldErrors({});
    setSubmitError(null);
  }, []);

  React.useEffect(() => {
    if (!visible) {
      reset();
      return;
    }
    if (isEdit && editingItem) {
      setForm(lostAnimalDtoToFormState(editingItem));
      setImageUri(lostAnimalImageUrl(editingItem));
      setPickedNewPhoto(false);
      setFieldErrors({});
      setSubmitError(null);
    } else if (!isEdit) {
      reset();
    }
  }, [visible, isEdit, editingItem, reset]);

  const handleClose = useCallback(() => {
    if (publishing) return;
    reset();
    onClose();
  }, [onClose, publishing, reset]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setFieldErrors((prev) => ({
        ...prev,
        photo: 'Permita o acesso à galeria para enviar a foto.',
      }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setPickedNewPhoto(true);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    }
  }, []);

  const patch = useCallback((key: keyof LostAnimalFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSubmitError(null);
  }, []);

  const patchDate = useCallback((value: string) => {
    patch('missingDate', formatBrazilDateInput(value));
  }, [patch]);

  const patchContact = useCallback((value: string) => {
    patch('contact', formatContactInput(value));
  }, [patch]);

  const hasPhoto = !!imageUri || !!existingPhotoUrl;
  const canSubmit = useMemo(() => !publishing, [publishing]);

  const handleSubmit = useCallback(() => {
    const errors = validateLostAnimalForm(form, Boolean(imageUri || existingPhotoUrl), {
      requirePhoto: !isEdit,
    });
    if (hasFormErrors(errors)) {
      setFieldErrors(errors);
      setSubmitError(
        isEdit
          ? 'Corrija os campos destacados antes de salvar.'
          : 'Corrija os campos destacados antes de publicar.',
      );
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    const uriToSend = pickedNewPhoto ? imageUri : isEdit ? null : imageUri;
    if (!isEdit && !uriToSend) return;
    onSubmit(form, uriToSend);
  }, [form, hasPhoto, imageUri, isEdit, onSubmit, pickedNewPhoto]);

  const inputStyle = (key: keyof LostAnimalFormState | 'photo') => [
    styles.input,
    fieldErrors[key] ? styles.inputError : null,
  ];

  const title = isEdit ? 'Editar publicação' : 'Publicar animal perdido';
  const submitLabel = isEdit ? 'Salvar' : 'Publicar';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={handleClose} hitSlop={12} disabled={publishing}>
              <Ionicons name="close" size={26} color={AppColors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Pressable
              style={[styles.photoPickBtn, fieldErrors.photo ? styles.photoPickBtnError : null]}
              onPress={() => void pickImage()}
            >
              <Ionicons name="camera-outline" size={20} color="#059669" />
              <Text style={styles.photoPickText}>
                {imageUri ? 'Trocar foto' : 'Foto do animal *'}
              </Text>
            </Pressable>
            {fieldErrors.photo ? <Text style={styles.fieldError}>{fieldErrors.photo}</Text> : null}
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.photoPreview} /> : null}

            <Text style={styles.label}>Nome do animal</Text>
            <TextInput
              style={inputStyle('animalName')}
              placeholder="Ex.: Thor (opcional)"
              value={form.animalName}
              onChangeText={(v) => patch('animalName', v)}
              maxLength={120}
            />

            <Text style={styles.label}>Espécie *</Text>
            <TextInput
              style={inputStyle('species')}
              placeholder="Ex.: Cão, Gato..."
              value={form.species}
              onChangeText={(v) => patch('species', v)}
              maxLength={80}
            />
            {fieldErrors.species ? <Text style={styles.fieldError}>{fieldErrors.species}</Text> : null}

            <Text style={styles.label}>Raça</Text>
            <TextInput
              style={inputStyle('breed')}
              placeholder="Ex.: SRD (opcional)"
              value={form.breed}
              onChangeText={(v) => patch('breed', v)}
              maxLength={80}
            />

            <Text style={styles.label}>Local visto/perdido *</Text>
            <TextInput
              style={inputStyle('missingLocation')}
              placeholder="Ex.: Praça Central, bairro X"
              value={form.missingLocation}
              onChangeText={(v) => patch('missingLocation', v)}
              maxLength={255}
            />
            {fieldErrors.missingLocation ? (
              <Text style={styles.fieldError}>{fieldErrors.missingLocation}</Text>
            ) : null}

            <Text style={styles.label}>Data do desaparecimento *</Text>
            <TextInput
              style={inputStyle('missingDate')}
              placeholder="DD/MM/AAAA (ex.: 20/05/2026)"
              value={form.missingDate}
              onChangeText={patchDate}
              keyboardType="number-pad"
              maxLength={10}
            />
            {fieldErrors.missingDate ? (
              <Text style={styles.fieldError}>{fieldErrors.missingDate}</Text>
            ) : null}

            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={[inputStyle('description'), styles.textarea]}
              placeholder="Cor, coleira, comportamento, circunstâncias..."
              value={form.description}
              onChangeText={(v) => patch('description', v)}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />
            {fieldErrors.description ? (
              <Text style={styles.fieldError}>{fieldErrors.description}</Text>
            ) : null}

            <Text style={styles.label}>Contato do responsável *</Text>
            <TextInput
              style={inputStyle('contact')}
              placeholder="(11) 99999-9999"
              value={form.contact}
              onChangeText={patchContact}
              keyboardType={form.contact.includes('@') ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              maxLength={120}
            />
            {fieldErrors.contact ? <Text style={styles.fieldError}>{fieldErrors.contact}</Text> : null}

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

            <View style={styles.actions}>
              <Pressable onPress={handleClose} style={styles.cancelBtn} disabled={publishing}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color={AppColors.text.white} />
                ) : (
                  <Text style={styles.confirmText}>{submitLabel}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.background.overlayStrong,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: AppColors.text.secondary, flex: 1 },
  scrollContent: { padding: 16, gap: 6, paddingBottom: 24 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.tertiary,
    marginTop: 6,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: AppColors.text.secondary,
    backgroundColor: AppColors.background.default,
  },
  inputError: {
    borderColor: AppColors.status.error,
    backgroundColor: 'rgba(231, 76, 60, 0.04)',
  },
  fieldError: {
    color: AppColors.status.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  submitError: {
    color: AppColors.status.error,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  textarea: { minHeight: 88 },
  photoPickBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  photoPickBtnError: {
    borderColor: AppColors.status.error,
    backgroundColor: 'rgba(231, 76, 60, 0.06)',
  },
  photoPickText: { color: '#047857', fontWeight: '700', fontSize: 15 },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: AppColors.background.muted,
    marginBottom: 8,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelText: { color: AppColors.text.tertiary, fontWeight: '700', fontSize: 16 },
  confirmBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmText: { color: AppColors.text.white, fontWeight: '800', fontSize: 16 },
});
