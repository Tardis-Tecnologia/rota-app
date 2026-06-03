import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import TabBarItem from '@/components/TabBarItem';
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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.tab.active,
        tabBarInactiveTintColor: AppColors.tab.inactive,
        headerShown: false, // Remover header padrão
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: AppColors.background.default },
        tabBarStyle,
        tabBarItemStyle: {
          flex: 1,
          width: 0,
          minWidth: 0,
          paddingHorizontal: 0,
          alignItems: 'center',
          justifyContent: 'center',
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
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <TabBarItem label="Início" icon="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="eventos"
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
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                activeOpacity={0.7}
                onPress={() => router.push('/evento/buscar' as Href)}
              >
                <Ionicons name="search-outline" size={22} color={AppColors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                activeOpacity={0.7}
                onPress={() => router.push('/evento/salvos' as Href)}
              >
                <Ionicons name="bookmark-outline" size={22} color={AppColors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                activeOpacity={0.7}
                onPress={() => router.push('/evento/meus' as Href)}
              >
                <Ionicons name="ticket-outline" size={22} color={AppColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ),
          title: 'Eventos',
          tabBarIcon: ({ color, focused }) => (
            <TabBarItem label="Eventos" icon="calendar-outline" color={color} focused={focused} />
          ),
        })}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <TabBarItem label="Mapa" icon="map-outline" color={color} focused={focused} />
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
      <Tabs.Screen
        name="messages"
        options={({ navigation }) => ({
          href: null,
          tabBarItemStyle: { display: 'none' },
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
        })}
      />
       <Tabs.Screen
        name="services"
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Serviços',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '700',
            color: '#000',
          },
          headerStyle: {
            backgroundColor: '#F8FAFC',
            shadowOpacity: 0,
            elevation: 0,
            borderBottomWidth: 0,
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
                color="#000"
              />
            </TouchableOpacity>
          ),
          headerRight: () => <View style={styles.headerSpacer} />,
          tabBarIcon: ({ color, focused }) => (
            <TabBarItem
              label="Serviços"
              icon="document-text-outline"
              color={color}
              focused={focused}
            />
          ),
        })}
      />
      {/* <Tabs.Screen
        name="services"
        options={{ href: null }}
      /> */}
      {/*
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
      */}
      <Tabs.Screen
        name="forum"
        options={() => ({
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
              onPress={() => router.push('/(tabs)/home')}
            >
              <Ionicons
                name="arrow-back-outline"
                size={24}
                color={AppColors.text.secondary}
              />
            </TouchableOpacity>
          ),
          headerRight: () => <View style={styles.headerSpacer} />,
          title: 'Fórum do bairro',
          tabBarIcon: ({ color, focused }) => (
            <TabBarItem label="Fórum" icon="chatbubbles-outline" color={color} focused={focused} />
          ),
        })}
      />
      <Tabs.Screen
        name="feed"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerSpacer: {
    width: 48,
    marginRight: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
});
