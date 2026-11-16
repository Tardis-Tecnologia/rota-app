import { withListImageCacheBust } from '@/components/forum/forumUtils';
import {
  removeCommercialGalleryPhoto,
  uploadCommercialGalleryPhotoFromUri,
} from '@/services/commercialProfileApi';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const MAX_GALLERY = 8;

type StoreProfileGalleryProps = {
  images: string[];
  editable?: boolean;
  imageEpoch?: number;
  onImagesChange?: (urls: string[]) => void;
};

export default function StoreProfileGallery({
  images,
  editable = false,
  imageEpoch = 0,
  onImagesChange,
}: StoreProfileGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const displayImages = useMemo(
    () => images.map((u) => u.trim()).filter(Boolean).slice(0, MAX_GALLERY),
    [images],
  );

  const canAdd = editable && displayImages.length < MAX_GALLERY && !uploading;

  const onAddImage = useCallback(async () => {
    if (!editable || !onImagesChange) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Permita o acesso à galeria para adicionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const { galleryImageUrls } = await uploadCommercialGalleryPhotoFromUri(asset.uri, {
        mimeType: asset.mimeType ?? undefined,
        fileName: asset.fileName ?? undefined,
      });
      onImagesChange(galleryImageUrls);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
    }
  }, [editable, onImagesChange]);

  const onRemoveImage = useCallback(
    (url: string) => {
      if (!editable || !onImagesChange) return;
      Alert.alert('Remover foto', 'Deseja remover esta imagem do feed da loja?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const { galleryImageUrls } = await removeCommercialGalleryPhoto(url);
                onImagesChange(galleryImageUrls);
              } catch (e) {
                Alert.alert(
                  'Erro',
                  e instanceof Error ? e.message : 'Não foi possível remover a imagem.',
                );
              }
            })();
          },
        },
      ]);
    },
    [editable, onImagesChange],
  );

  if (!editable && displayImages.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Galeria da loja</Text>
        {editable ? (
          <Text style={styles.counter}>
            {displayImages.length}/{MAX_GALLERY}
          </Text>
        ) : null}
      </View>
      {editable ? (
        <Text style={styles.hint}>
          Fotos que os clientes veem no seu perfil no feed. Toque em + para adicionar (máx. 8).
        </Text>
      ) : null}

      <View style={styles.grid}>
        {displayImages.map((uri) => (
          <Pressable
            key={uri}
            style={styles.cell}
            onPress={() => setPreviewUri(uri)}
            accessibilityRole="button"
            accessibilityLabel="Ver foto da loja"
          >
            <Image
              source={{ uri: withListImageCacheBust(uri, imageEpoch) }}
              style={styles.cellImage}
              contentFit="cover"
            />
            {editable ? (
              <Pressable
                style={styles.removeBtn}
                onPress={() => onRemoveImage(uri)}
                hitSlop={6}
                accessibilityLabel="Remover foto"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            ) : null}
          </Pressable>
        ))}

        {canAdd ? (
          <Pressable
            style={[styles.cell, styles.addCell]}
            onPress={() => void onAddImage()}
            accessibilityLabel="Adicionar foto à galeria"
          >
            {uploading ? (
              <ActivityIndicator color="#0d9488" />
            ) : (
              <>
                <Ionicons name="add" size={28} color="#0d9488" />
                <Text style={styles.addText}>Adicionar</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      {editable && displayImages.length === 0 && !uploading ? (
        <Text style={styles.emptyText}>
          Nenhuma foto no feed ainda. Adicione imagens do estabelecimento, produtos ou promoções.
        </Text>
      ) : null}

      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewUri(null)}>
          {previewUri ? (
            <Image
              source={{ uri: withListImageCacheBust(previewUri, imageEpoch) }}
              style={styles.previewImage}
              contentFit="contain"
            />
          ) : null}
          <Pressable style={styles.previewClose} onPress={() => setPreviewUri(null)} hitSlop={8}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  counter: { fontSize: 12, fontWeight: '700', color: '#0d9488' },
  hint: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  cellImage: { width: '100%', height: '100%' },
  addCell: {
    borderWidth: 1.5,
    borderColor: '#99f6e4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#f0fdfa',
  },
  addText: { fontSize: 10, fontWeight: '700', color: '#0d9488' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { marginTop: 8, fontSize: 13, color: '#94a3b8', lineHeight: 18 },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewImage: { width: '100%', height: '80%' },
  previewClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    padding: 8,
  },
});
