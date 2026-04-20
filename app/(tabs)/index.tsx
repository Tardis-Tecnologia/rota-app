import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user } = useAuth();
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  /** Logado ou visitante: ambos usam as abas. */
  return <Redirect href="/(tabs)/home" />;
}

