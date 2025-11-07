import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.tab.active,
        tabBarInactiveTintColor: AppColors.tab.inactive,
        headerShown: false, // Remover header padrão
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: AppColors.tab.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 999,
          borderTopColor: 'transparent',
          ...Platform.select({
            ios: {
              shadowColor: AppColors.shadow,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            },
            android: {
              elevation: 20,
            },
          }),
        },
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
