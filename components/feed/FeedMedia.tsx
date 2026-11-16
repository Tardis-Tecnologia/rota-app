import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';

type FeedMediaProps = {
  uri: string;
  contentType?: string | null;
  /** Padrão Instagram: 4:5. Use 1 para quadrado. */
  aspectRatio?: number;
  style?: StyleProp<ImageStyle | ViewStyle>;
};

export function isVideoMedia(uri?: string | null, contentType?: string | null): boolean {
  const ct = (contentType ?? '').toLowerCase();
  if (ct.startsWith('video/')) return true;
  const u = (uri ?? '').toLowerCase();
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}

export default function FeedMedia({
  uri,
  contentType,
  aspectRatio = 4 / 5,
  style,
}: FeedMediaProps) {
  const video = useMemo(() => isVideoMedia(uri, contentType), [uri, contentType]);

  if (!uri) return null;

  const frameStyle = [styles.frame, { aspectRatio }, style];

  if (!video) {
    return (
      <Image
        source={{ uri }}
        style={frameStyle as StyleProp<ImageStyle>}
        resizeMode="cover"
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[frameStyle, styles.videoWrap]}>
        {React.createElement('video', {
          src: uri,
          controls: true,
          playsInline: true,
          preload: 'metadata',
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          },
        })}
        <View style={styles.videoBadge} pointerEvents="none">
          <Ionicons name="play" size={14} color="#fff" />
        </View>
      </View>
    );
  }

  const safeUri = uri.replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100%;object-fit:cover;background:#000}</style></head><body><video src="${safeUri}" controls playsinline webkit-playsinline preload="metadata"></video></body></html>`;

  return (
    <View style={[frameStyle, styles.videoWrap]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        scrollEnabled={false}
        bounces={false}
      />
      <View style={styles.videoBadge} pointerEvents="none">
        <Ionicons name="play" size={14} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'stretch',
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  videoWrap: {
    backgroundColor: '#000',
  },
  webview: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  videoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
