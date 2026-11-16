import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

type MarketplaceProductImageGalleryProps = {
  imageUris: string[];
  height?: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MarketplaceProductImageGallery({
  imageUris,
  height = 280,
}: MarketplaceProductImageGalleryProps) {
  const uris = useMemo(
    () => imageUris.map((u) => u.trim()).filter(Boolean),
    [imageUris],
  );
  const [index, setIndex] = useState(0);
  const scrollingRef = useRef(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / SCREEN_WIDTH);
    if (next !== index && next >= 0 && next < uris.length) {
      setIndex(next);
    }
  };

  if (uris.length === 0) {
    return (
      <LinearGradient colors={['#6366f1', '#a855f7']} style={[styles.hero, { height }]}>
        <Ionicons name="cube-outline" size={48} color="#fff" />
      </LinearGradient>
    );
  }

  if (uris.length === 1) {
    return (
      <Image source={{ uri: uris[0] }} style={[styles.hero, { height }]} resizeMode="cover" />
    );
  }

  return (
    <View style={{ height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          scrollingRef.current = true;
        }}
        onMomentumScrollEnd={() => {
          scrollingRef.current = false;
        }}
      >
        {uris.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            style={[styles.hero, { width: SCREEN_WIDTH, height }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {uris.map((uri, i) => (
          <View key={`${uri}-dot-${i}`} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
});
