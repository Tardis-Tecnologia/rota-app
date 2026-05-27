import { AuthNavigationSync } from '@/components/AuthNavigationSync';
import { ThemeSyncOnNavigation } from '@/components/ThemeSyncOnNavigation';
import { AppThemeProvider } from '@/contexts/AppThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';
import { configureGoogleSignIn } from '@/services/googleAuth';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppThemeProvider>
        <AuthNavigationSync />
        <ThemeSyncOnNavigation />
        <ConversationsProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="notifications"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HealthService"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="SearchTab" options={{ headerShown: false }} />

          <Stack.Screen name="PublicTransportation" options={{ headerShown: false }} />
          <Stack.Screen
            name="ServicesAndProfessionals"
            options={{ title: 'Serviços e Profissionais', headerShown: false }}
          />
          <Stack.Screen name="guia" options={{ headerShown: false }} />
          <Stack.Screen name="directions" options={{ headerShown: false }} />
          <Stack.Screen name="EducationTab" options={{ headerShown: false }} />
          <Stack.Screen name="JobsTab" options={{ headerShown: false }} />
          <Stack.Screen name="JobDetailTab" options={{ headerShown: false }} />
          <Stack.Screen name="ProfileProviderTab" options={{ headerShown: false }} />
          <Stack.Screen name="ChatTab" options={{ headerShown: false }} />
          <Stack.Screen name="Profile" options={{ headerShown: false }} />
          <Stack.Screen name="edit-account" options={{ headerShown: false }} />
          <Stack.Screen name="pulso" options={{ headerShown: false }} />
          <Stack.Screen name="missions" options={{ headerShown: false }} />
          <Stack.Screen name="comerciante" options={{ headerShown: false }} />
          <Stack.Screen name="forum" options={{ headerShown: false }} />
          <Stack.Screen name="evento" options={{ headerShown: false }} />
          <Stack.Screen name="novidade" options={{ headerShown: false }} />
          <Stack.Screen name="marketplace" options={{ headerShown: false }} />
        </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </ConversationsProvider>
        </AppThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
