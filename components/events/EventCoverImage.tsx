import { AppColors } from '@/constants/theme';
import { eventImageSource } from '@/utils/eventImage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type EventCoverImageProps = {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
};

export default function EventCoverImage({
  uri,
  style,
  placeholderIcon = 'image-outline',
}: EventCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const source = eventImageSource(uri);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!source || failed) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name={placeholderIcon} size={40} color={AppColors.gray[500]} />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={[styles.image, style]}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: AppColors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
