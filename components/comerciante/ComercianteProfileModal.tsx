import Toast from '@/components/Toast';
import { withListImageCacheBust } from '@/components/forum/forumUtils';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCommercialMyProfile,
  updateCommercialMyProfile,
  uploadCommercialMyProfilePhotoFromUri,
  type CommercialMyProfile,
} from '@/services/commercialProfileApi';
import { formatCnpjInput } from '@/utils/cnpjMask';
import { formatCepDisplay } from '@/services/viacep';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FieldKey =
  | 'storeName'
  | 'cnpj'
  | 'cep'
  | 'segment'
  | 'address'
  | 'responsibleName'
  | 'phone'
  | 'description';

type ComercianteProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?u=loja-demo-rota';

export default function ComercianteProfileModal({
  visible,
  onClose,
}: ComercianteProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { user, syncCommercialProfileSession } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCacheEpoch, setPhotoCacheEpoch] = useState(() => Date.now());

  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [segment, setSegment] = useState('');
  const [address, setAddress] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const showSuccessToast = useCallback(() => {
    setShowToast(false);
    setToastKey((k) => k + 1);
    setTimeout(() => setShowToast(true), 50);
  }, []);

  const applyProfileToForm = useCallback((profile: CommercialMyProfile) => {
    setEmail(profile.email);
    setStoreName(profile.storeName);
    setCnpj(formatCnpjInput(profile.cnpj ?? ''));
    setCep(formatCepDisplay(profile.cep ?? ''));
    setSegment(profile.segment ?? '');
    setAddress(profile.address ?? '');
    setResponsibleName(profile.responsibleName);
    setPhone(profile.phone);
    setDescription(profile.description ?? '');
    const url = profile.photoUrl?.trim() || null;
    setPhotoPreview(url);
    if (url) setPhotoCacheEpoch(Date.now());
  }, []);

  const mergeProfileWithSession = useCallback(
    (profile: CommercialMyProfile): CommercialMyProfile => ({
      ...profile,
      cnpj: profile.cnpj?.trim() || user?.commercialCnpj?.trim() || null,
      cep: profile.cep?.trim() || user?.commercialCep?.trim() || null,
    }),
    [user?.commercialCep, user?.commercialCnpj],
  );

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setServerError('');
    try {
      const profile = mergeProfileWithSession(await getCommercialMyProfile());
      applyProfileToForm(profile);
      await syncCommercialProfileSession({
        storeName: profile.storeName,
        photoUrl: profile.photoUrl,
        cep: profile.cep,
        cnpj: profile.cnpj,
      });
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : 'Não foi possível carregar o perfil da loja.',
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [applyProfileToForm, mergeProfileWithSession, syncCommercialProfileSession]);

  useEffect(() => {
    if (visible) {
      void loadProfile();
    } else {
      setServerError('');
      setFieldErrors({});
    }
    // Recarrega só ao abrir o modal; evita sobrescrever foto recém-enviada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const clearFieldError = (key: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const applyAvatarFromUri = useCallback(
    async (uri: string, mimeType?: string | null, fileName?: string | null) => {
      setPhotoPreview(uri);
      setPhotoCacheEpoch(Date.now());
      setPhotoUploading(true);
      setServerError('');
      try {
        const result = await uploadCommercialMyProfilePhotoFromUri(uri, {
          mimeType: mimeType ?? undefined,
          fileName: fileName ?? undefined,
        });
        setPhotoPreview(result.photoUrl);
        setPhotoCacheEpoch(Date.now());
        await syncCommercialProfileSession({
          storeName: storeName.trim() || undefined,
          photoUrl: result.photoUrl,
        });
        showSuccessToast();
      } catch (e) {
        setServerError(
          e instanceof Error ? e.message : 'Não foi possível atualizar a foto. Tente novamente.',
        );
      } finally {
        setPhotoUploading(false);
      }
    },
    [showSuccessToast, storeName, syncCommercialProfileSession],
  );

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
      aspect: [1, 1],
      quality: 0.85,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      await applyAvatarFromUri(asset.uri, asset.mimeType ?? null, asset.fileName ?? null);
    }
  }, [applyAvatarFromUri]);

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
      aspect: [1, 1],
      quality: 0.85,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      await applyAvatarFromUri(asset.uri, asset.mimeType ?? null, asset.fileName ?? null);
    }
  }, [applyAvatarFromUri]);

  const onPressChangePhoto = useCallback(() => {
    Alert.alert('Foto da loja', 'Escolha uma opção', [
      { text: 'Galeria', onPress: () => void pickFromGallery() },
      { text: 'Câmera', onPress: () => void takePhoto() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [pickFromGallery, takePhoto]);

  const handleClose = () => {
    if (saving || photoUploading) return;
    onClose();
  };

  const handleSave = async () => {
    setServerError('');
    const next: Partial<Record<FieldKey, string>> = {};

    if (!storeName.trim()) {
      next.storeName = 'O nome da loja é obrigatório.';
    }
    if (!responsibleName.trim()) {
      next.responsibleName = 'O nome do responsável é obrigatório.';
    }
    if (!phone.trim()) {
      next.phone = 'O telefone é obrigatório.';
    }
    const cepDigits = cep.replace(/\D/g, '');
    if (cepDigits && cepDigits.length !== 8) {
      next.cep = 'CEP inválido.';
    }

    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await updateCommercialMyProfile({
        storeName: storeName.trim(),
        cnpj: cnpj.replace(/\D/g, ''),
        cep: cep.replace(/\D/g, ''),
        segment: segment.trim(),
        address: address.trim(),
        responsibleName: responsibleName.trim(),
        phone: phone.trim(),
        description: description.trim(),
      });
      await syncCommercialProfileSession({
        storeName: storeName.trim(),
        photoUrl: photoPreview,
        cep: cep.replace(/\D/g, ''),
        cnpj: cnpj.replace(/\D/g, ''),
      });
      showSuccessToast();
      onClose();
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  const avatarUri = useMemo(() => {
    const raw = photoPreview?.trim() || user?.photoUrl?.trim() || '';
    if (!raw || raw === DEFAULT_AVATAR) return DEFAULT_AVATAR;
    if (raw.startsWith('file://') || raw.startsWith('ph://') || raw.startsWith('content://')) {
      return raw;
    }
    return withListImageCacheBust(raw, photoCacheEpoch);
  }, [photoCacheEpoch, photoPreview, user?.photoUrl]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            disabled={saving || photoUploading}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={AppColors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Perfil da loja</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loadingProfile ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={AppColors.accent} />
            <Text style={styles.loadingText}>Carregando perfil…</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={[
                styles.scroll,
                { paddingBottom: Math.max(insets.bottom, 24) + 16 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.photoSection}>
                <Pressable onPress={onPressChangePhoto} disabled={photoUploading || saving}>
                  <View style={styles.photoOuter}>
                    <View style={styles.photoWrap}>
                      <Image
                        key={avatarUri}
                        source={{ uri: avatarUri }}
                        style={styles.photo}
                        cachePolicy="none"
                      />
                      {photoUploading ? (
                        <View style={styles.photoOverlay}>
                          <ActivityIndicator color="#fff" />
                        </View>
                      ) : null}
                    </View>
                    {!photoUploading ? (
                      <View style={styles.photoBadge}>
                        <Ionicons name="camera" size={18} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
                <TouchableOpacity
                  onPress={onPressChangePhoto}
                  disabled={photoUploading || saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.changePhotoText}>Alterar foto</Text>
                </TouchableOpacity>
              </View>

              <Field
                label="Nome da loja"
                value={storeName}
                onChangeText={(t) => {
                  setStoreName(t);
                  clearFieldError('storeName');
                  setServerError('');
                }}
                error={fieldErrors.storeName}
                editable={!saving}
              />

              <Field
                label="E-mail"
                value={email}
                onChangeText={() => {}}
                editable={false}
                hint="Somente leitura"
              />

              <Field
                label="CNPJ"
                value={cnpj}
                onChangeText={(t) => {
                  setCnpj(formatCnpjInput(t));
                  clearFieldError('cnpj');
                  setServerError('');
                }}
                error={fieldErrors.cnpj}
                editable={!saving}
                keyboardType="number-pad"
              />

              <Field
                label="CEP"
                value={cep}
                onChangeText={(t) => {
                  setCep(formatCepDisplay(t));
                  clearFieldError('cep');
                  setServerError('');
                }}
                error={fieldErrors.cep}
                keyboardType="number-pad"
                editable={!saving}
              />

              <Field
                label="Segmento"
                value={segment}
                onChangeText={(t) => {
                  setSegment(t);
                  clearFieldError('segment');
                  setServerError('');
                }}
                error={fieldErrors.segment}
                editable={!saving}
                placeholder="Ex.: pet shop, restaurante"
              />

              <Field
                label="Endereço"
                value={address}
                onChangeText={(t) => {
                  setAddress(t);
                  clearFieldError('address');
                  setServerError('');
                }}
                error={fieldErrors.address}
                editable={!saving}
              />

              <Field
                label="Responsável"
                value={responsibleName}
                onChangeText={(t) => {
                  setResponsibleName(t);
                  clearFieldError('responsibleName');
                  setServerError('');
                }}
                error={fieldErrors.responsibleName}
                editable={!saving}
              />

              <Field
                label="Telefone"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  clearFieldError('phone');
                  setServerError('');
                }}
                error={fieldErrors.phone}
                keyboardType="phone-pad"
                editable={!saving}
              />

              <Field
                label="Descrição"
                value={description}
                onChangeText={(t) => {
                  setDescription(t);
                  clearFieldError('description');
                  setServerError('');
                }}
                error={fieldErrors.description}
                editable={!saving}
                multiline
              />

              {serverError ? (
                <View style={styles.errorWrap}>
                  <Ionicons name="alert-circle" size={18} color={AppColors.status.error} />
                  <Text style={styles.errorText}>{serverError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, (saving || photoUploading) && styles.saveBtnDisabled]}
                onPress={() => void handleSave()}
                disabled={saving || photoUploading}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar alterações</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        <Toast
          key={toastKey}
          message="Perfil atualizado com sucesso!"
          visible={showToast}
          type="success"
          duration={2800}
          onHide={() => setShowToast(false)}
        />
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
  editable = true,
  hint,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  editable?: boolean;
  hint?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          !editable && styles.inputDisabled,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={AppColors.gray[500]}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
    backgroundColor: AppColors.background.default,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: { opacity: 0.7 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  headerSpacer: { width: 40 },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 0,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoOuter: {
    width: 96,
    height: 96,
    position: 'relative',
  },
  photoWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: AppColors.gray[200],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.accent,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.text.secondary,
    backgroundColor: AppColors.background.default,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 12,
  },
  inputDisabled: {
    backgroundColor: AppColors.gray[100],
    color: AppColors.text.tertiary,
  },
  inputError: {
    borderColor: AppColors.status.error,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.status.error,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.background.backgroundDanger,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.status.error,
  },
  saveBtn: {
    marginTop: 8,
    backgroundColor: AppColors.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.white,
  },
});
