import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


export default function TabLayout() {
  const colorScheme = useColorScheme();
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
      paddingTop: 8,
      marginHorizontal: 16,
      marginBottom: androidNavOffset + Math.max(4, bottomInset / 2),
      borderRadius: 24,
      borderTopColor: 'transparent',
      ...Platform.select({
        ios: {
          shadowColor: AppColors.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 14,
        },
        android: {
          elevation: 10,
        },
      }),
    };
  }, [insets.bottom]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.tab.active,
        tabBarInactiveTintColor: AppColors.tab.inactive,
        headerShown: false, // Remover header padrão
        tabBarButton: HapticTab,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Esconder da tab bar
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="home-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="compass-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Serviços',
          headerLeft: () => (
            <Ionicons 
              name="arrow-back-outline" 
              paddingLeft={20}
              size={24} 
              color={'black'} 
              onPress={() => navigation.goBack()}
            />
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="document-text-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
          tabBarStyle: { display: 'none' },       
        })}
      />
      <Tabs.Screen
        name="messages"
        options={({ navigation }) => ({
          headerShown: true,
          headerLeft: () => (
            <Ionicons 
              name="arrow-back-outline" 
              paddingLeft={20}
              size={24} 
              color={'black'} 
              onPress={() => navigation.goBack()}
            />
          ),
          title: 'Mensagens',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="chatbubbles-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
          tabBarStyle: { display: 'none' },       
        })}
      />
      <Tabs.Screen
        name="feed"
        options={({ navigation }) => ({
          headerShown: true,
          headerLeft: () => (
            <Ionicons 
              name="arrow-back-outline" 
              paddingLeft={20}
              size={24} 
              color={'black'} 
              onPress={() => navigation.goBack()}
            />
          ),
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="list-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
          tabBarStyle: { display: 'none' },       
        })}
      />
    </Tabs>
  );
}
