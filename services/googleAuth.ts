import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

const FALLBACK_GOOGLE_WEB_CLIENT_ID =
  '845258052347-t5qnlt30q4t1emjf4rfhu8badqpkh4co.apps.googleusercontent.com';

  const FALLBACK_GOOGLE_IOS_CLIENT_ID =
  '845258052347-ah9dgfqh0dsjburvlcsr234qnacimf88.apps.googleusercontent.com';

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured || Platform.OS === 'web') return;

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? FALLBACK_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? FALLBACK_GOOGLE_IOS_CLIENT_ID
  });

  configured = true;
}

export async function disconnectGoogleAccount(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // O logout local da API já foi concluído; não bloqueamos por erro do Google SDK.
  }
}
