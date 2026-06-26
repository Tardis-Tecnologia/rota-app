import { MAP_WEBVIEW_HTML } from '@/components/map/mapWebViewHtml';
import type { Region } from '@/types';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

export type MapWebViewCommand =
  | {
      type: 'init';
      styleUrl?: string;
      styleJson?: string;
      center: [number, number];
      zoom: number;
      is3d?: boolean;
      defaultPitch?: number;
      belowLayerId?: string;
    }
  | {
      type: 'setStyle';
      styleUrl?: string;
      styleJson?: string;
      is3d?: boolean;
      defaultPitch?: number;
      belowLayerId?: string;
      pontos?: Array<{
        id: string;
        titulo: string;
        latitude: number;
        longitude: number;
        markerColor?: string;
      }>;
      variant?: 'card' | 'dot';
      layerKey?: string | number;
      route?: [number, number][];
      origin?: { latitude: number; longitude: number };
      destination?: { latitude: number; longitude: number };
    }
  | {
      type: 'setCamera';
      center?: [number, number];
      longitude?: number;
      latitude?: number;
      zoom?: number;
      pitch?: number;
      duration?: number;
    }
  | {
      type: 'setPontos';
      pontos: Array<{
        id: string;
        titulo: string;
        latitude: number;
        longitude: number;
        markerColor?: string;
      }>;
      variant: 'card' | 'dot';
      layerKey?: string | number;
    }
  | {
      type: 'setRoute';
      coordinates: [number, number][];
      origin?: { latitude: number; longitude: number } | null;
      destination?: { latitude: number; longitude: number; title?: string };
    }
  | {
      type: 'set3d';
      enabled: boolean;
      belowLayerId?: string;
      defaultPitch?: number;
    };

export type MapWebViewBridgeRef = {
  sendCommand: (command: MapWebViewCommand) => void;
};

type MapWebViewBridgeProps = {
  style?: ViewStyle;
  onBridgeReady?: () => void;
  onReady?: () => void;
  onRegionChangeComplete?: (region: Region, isUserInteraction: boolean) => void;
  onUserDragMap?: () => void;
  onMarkerPress?: (id: string) => void;
};

const MapWebViewBridge = forwardRef<MapWebViewBridgeRef, MapWebViewBridgeProps>(
  function MapWebViewBridge(
    { style, onBridgeReady, onReady, onRegionChangeComplete, onUserDragMap, onMarkerPress },
    ref,
  ) {
    const webRef = useRef<WebView>(null);

    const dispatchToWeb = useCallback((command: MapWebViewCommand) => {
      const serialized = JSON.stringify(command);
      webRef.current?.injectJavaScript(
        `window.__handleMapCommand && window.__handleMapCommand(${JSON.stringify(serialized)}); true;`,
      );
    }, []);

    const sendCommand = useCallback(
      (command: MapWebViewCommand) => {
        dispatchToWeb(command);
      },
      [dispatchToWeb],
    );

    useImperativeHandle(ref, () => ({ sendCommand }), [sendCommand]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const payload = JSON.parse(event.nativeEvent.data) as {
            type?: string;
            latitude?: number;
            longitude?: number;
            latitudeDelta?: number;
            longitudeDelta?: number;
            isUserInteraction?: boolean;
            id?: string;
            message?: string;
          };

          if (payload.type === 'htmlReady') {
            onBridgeReady?.();
            return;
          }

          if (payload.type === 'ready') {
            onReady?.();
            return;
          }

          if (payload.type === 'regionChange') {
            if (
              payload.latitude == null ||
              payload.longitude == null ||
              payload.latitudeDelta == null ||
              payload.longitudeDelta == null
            ) {
              return;
            }
            if (payload.isUserInteraction) {
              onUserDragMap?.();
            }
            onRegionChangeComplete?.(
              {
                latitude: payload.latitude,
                longitude: payload.longitude,
                latitudeDelta: payload.latitudeDelta,
                longitudeDelta: payload.longitudeDelta,
              },
              !!payload.isUserInteraction,
            );
            return;
          }

          if (payload.type === 'markerPress' && payload.id) {
            onMarkerPress?.(payload.id);
            return;
          }

          if (payload.type === 'mapError') {
            console.warn('[MapWebView]', payload.message ?? 'erro no mapa');
          }
        } catch {
          // ignore malformed messages
        }
      },
      [onBridgeReady, onMarkerPress, onReady, onRegionChangeComplete, onUserDragMap],
    );

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html: MAP_WEBVIEW_HTML, baseUrl: 'https://localhost' }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          allowsInlineMediaPlayback
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          mixedContentMode="always"
          allowUniversalAccessFromFileURLs
          allowFileAccess
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#e8ecf1' },
});

export default MapWebViewBridge;
