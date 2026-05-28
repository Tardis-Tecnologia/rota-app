import { HapticTab } from '@/components/haptic-tab';
import { ComercianteStoreProvider } from '@/contexts/ComercianteStoreContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ACTIVE = '#0d9488';
const TAB_INACTIVE = '#94a3b8';

export default function ComercianteLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = useMemo(() => {
    const baseHeight = Platform.OS === 'ios' ? 56 : 48;
    return {
      backgroundColor: '#ffffff',
      borderTopWidth: 0,
      height: baseHeight + insets.bottom,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingTop: 10,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    };
  }, [insets.bottom]);

  return (
    <ComercianteStoreProvider>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        sceneStyle: { backgroundColor: '#f1f5f9' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cupons"
        options={{
          title: 'Cupons',
          tabBarIcon: ({ color }) => <Ionicons name="pricetag-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Fórum',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: 'Métricas',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={22} color={color} />,
        }}
      />
    </Tabs>
    </ComercianteStoreProvider>
  );
}
