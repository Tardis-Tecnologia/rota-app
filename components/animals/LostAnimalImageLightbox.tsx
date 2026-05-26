import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LostAnimalImageLightboxProps {
  visible: boolean;
  imageSource: ImageSourcePropType | null;
  title?: string;
  onClose: () => void;
}

export default function LostAnimalImageLightbox({
  visible,
  imageSource,
  title,
  onClose,
}: LostAnimalImageLightboxProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  if (!imageSource) return null;

  const imageMaxHeight = height - insets.top - insets.bottom - 120;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.root}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar foto"
      >
        <View
          style={[styles.header, { paddingTop: insets.top + 8 }]}
          onStartShouldSetResponder={() => true}
        >
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.titleSpacer} />
          )}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>

        <Pressable
          style={styles.imageArea}
          onPress={(e) => e.stopPropagation()}
        >
          <Image
            source={imageSource}
            style={{
              width: width - 24,
              height: imageMaxHeight,
            }}
            resizeMode="contain"
            accessibilityLabel={title ? `Foto de ${title}` : 'Foto do animal'}
          />
        </Pressable>

        <Text style={[styles.hint, { paddingBottom: insets.bottom + 16 }]}>
          Toque fora da foto ou no X para fechar
        </Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    zIndex: 1,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  titleSpacer: {
    flex: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    zIndex: 1,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    paddingHorizontal: 24,
    zIndex: 1,
  },
});
