import { AuthProvider } from '@/contexts/AuthContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ConversationsProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
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
            options={{ title: 'Serviços e Profissionais' }}
          />
          <Stack.Screen name="EducationTab" options={{ headerShown: false }} />
          <Stack.Screen name="JobsTab" options={{ headerShown: false }} />
          <Stack.Screen name="JobDetailTab" options={{ headerShown: false }} />
          <Stack.Screen name="ProfileProviderTab" options={{ headerShown: false }} />
          <Stack.Screen name="ChatTab" options={{ headerShown: false }} />
          <Stack.Screen name="Profile" options={{ headerShown: false }} />
        </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </ConversationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
