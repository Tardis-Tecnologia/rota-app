import { loginWithGoogle } from '@/services/authApi';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { useCallback } from 'react';
import { Platform } from 'react-native';

type GoogleAuthSuccess = {
  user: {
    id: string;
    email: string;
    name: string;
    profile: string;
    themeSlug: string | null;
    uf?: string | null;
    govbrSub?: string | null;
    cpf?: string | null;
    photoUrl?: string | null;
  };
  token: string;
};

export function useGoogleAuth(
  onSuccess: (result: GoogleAuthSuccess) => Promise<void> | void,
  onError?: (message: string) => void,
) {
  const login = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') {
        throw new Error('Login Google cancelado.');
      }

      const idToken = response.data.idToken?.trim();
      if (!idToken) {
        throw new Error('Google não retornou idToken.');
      }

      const session = await loginWithGoogle(idToken);
      await onSuccess({ token: session.token, user: session.user });
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          onError?.('Login com Google cancelado.');
          return;
        }
        if (error.code === statusCodes.IN_PROGRESS) {
          onError?.('Login com Google já está em andamento.');
          return;
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          onError?.('Google Play Services indisponível neste dispositivo.');
          return;
        }
      }

      const message =
        error instanceof Error ? error.message : 'Não foi possível entrar com o Google.';
      onError?.(message);
    }
  }, [onError, onSuccess]);

  return { loginWithGoogle: login, isGoogleAuthAvailable: Platform.OS !== 'web' };
}