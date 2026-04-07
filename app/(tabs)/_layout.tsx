import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/theme';

export default function TabLayout() {
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
        sceneStyle: { backgroundColor: AppColors.background.default },
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
        name="map"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="map-outline"
              size={24}
              color={focused ? AppColors.tab.active : AppColors.tab.inactive}
            />
          ),
        }}
      />
      {/* Tela "Explorar" desativada por enquanto (mantemos o arquivo, mas ocultamos a aba). */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
       {/* <Tabs.Screen
        name="services"
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Serviços',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: AppColors.text.secondary,
          },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back-outline"
                size={24}
                color={AppColors.text.secondary}
              />
            </TouchableOpacity>
          ),
          headerRight: () => <View style={styles.headerSpacer} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="document-text-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
        })}
      /> */}
      <Tabs.Screen
        name="services"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="messages"
        options={({ navigation }) => ({
          headerShown: true,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: AppColors.text.secondary,
          },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back-outline"
                size={24}
                color={AppColors.text.secondary}
              />
            </TouchableOpacity>
          ),
          headerRight: () => <View style={styles.headerSpacer} />,
          title: 'Mensagens',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="chatbubbles-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
        })}
      />
      <Tabs.Screen
        name="feed"
        options={({ navigation }) => ({
          headerShown: true,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: AppColors.text.secondary,
          },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back-outline"
                size={24}
                color={AppColors.text.secondary}
              />
            </TouchableOpacity>
          ),
          headerRight: () => <View style={styles.headerSpacer} />,
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="list-outline" 
              size={24} 
              color={focused ? AppColors.tab.active : AppColors.tab.inactive} 
            />
          ),
        })}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerSpacer: {
    width: 48,
    marginRight: 4,
  },
});
