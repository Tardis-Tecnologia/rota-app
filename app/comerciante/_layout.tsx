import { HapticTab } from '@/components/haptic-tab';
import TabBarItem from '@/components/TabBarItem';
import { AppColors } from '@/constants/theme';
import { ComercianteStoreProvider } from '@/contexts/ComercianteStoreContext';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ComercianteLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = useMemo(() => {
    const baseHeight = Platform.OS === 'ios' ? 58 : 44;
    const bottomInset = insets.bottom;
    const androidNavOffset = Platform.OS === 'android' ? 24 : 0;
    const effectiveInset = Math.max(bottomInset, 6);

    return {
      backgroundColor: AppColors.tab.background,
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
      height: baseHeight + effectiveInset,
      paddingBottom: 8 + bottomInset,
      paddingTop: 6,
      marginBottom: androidNavOffset,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      ...Platform.select({
        ios: {
          shadowColor: AppColors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    };
  }, [insets.bottom]);

  return (
    <ComercianteStoreProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: AppColors.tab.active,
          tabBarInactiveTintColor: AppColors.tab.inactive,
          tabBarShowLabel: false,
          tabBarStyle,
          tabBarItemStyle: {
            flex: 1,
            width: 0,
            minWidth: 0,
            paddingHorizontal: 0,
            alignItems: 'center',
            justifyContent: 'center',
          },
          sceneStyle: { backgroundColor: AppColors.background.default },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Painel',
            tabBarIcon: ({ color, focused }) => (
              <TabBarItem
                label="Painel"
                icon="storefront-outline"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="cupons"
          options={{
            title: 'Cupons',
            tabBarIcon: ({ color, focused }) => (
              <TabBarItem label="Cupons" icon="pricetag-outline" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="forum"
          options={{
            title: 'Fórum',
            tabBarIcon: ({ color, focused }) => (
              <TabBarItem
                label="Fórum"
                icon="chatbubbles-outline"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="metricas"
          options={{
            title: 'Métricas',
            tabBarIcon: ({ color, focused }) => (
              <TabBarItem
                label="Métricas"
                icon="bar-chart-outline"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mensagens"
          options={{
            href: null,
            title: 'Mensagens',
            tabBarItemStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </ComercianteStoreProvider>
  );
}
