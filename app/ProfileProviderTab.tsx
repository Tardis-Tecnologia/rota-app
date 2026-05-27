import type { Profile } from '@/types';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProviderProfile from '../components/ProviderProfile';

export default function ProfileProviderRoute() {
  const { provider, id } = useLocalSearchParams<{ provider?: string; id?: string }>();

  const profileId = String(id ?? '').trim();
  if (profileId) {
    return <Redirect href={`/guia/${profileId}`} />;
  }

  let data: Profile | null = null;
  try {
    data = provider ? (JSON.parse(provider) as Profile) : null;
  } catch {
    data = null;
  }

  if (!data) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ProviderProfile data={data} />
    </SafeAreaView>
  );
}
