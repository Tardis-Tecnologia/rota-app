import { Platform } from 'react-native';

const FALLBACK_GOOGLE_WEB_CLIENT_ID =
  '845258052347-t5qnlt30q4t1emjf4rfhu8badqpkh4co.apps.googleusercontent.com';

const FALLBACK_GOOGLE_IOS_CLIENT_ID =
  '845258052347-ah9dgfqh0dsjburvlcsr234qnacimf88.apps.googleusercontent.com';

export function getGoogleWebClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || FALLBACK_GOOGLE_WEB_CLIENT_ID;
}

export function getGoogleIosClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || FALLBACK_GOOGLE_IOS_CLIENT_ID;
}

/** Mantido por compatibilidade; expo-auth-session não exige configuração prévia. */
export function configureGoogleSignIn(): void {
  // noop — login via expo-auth-session no hook useGoogleAuth
}

export async function disconnectGoogleAccount(): Promise<void> {
  if (Platform.OS === 'web') return;
  // expo-auth-session não mantém sessão nativa do Google após o fluxo OAuth.
}
