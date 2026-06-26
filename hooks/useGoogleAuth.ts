import { loginWithGoogle } from '@/services/authApi';
import { getGoogleIosClientId, getGoogleWebClientId } from '@/services/googleAuth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

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
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: getGoogleWebClientId(),
    iosClientId: getGoogleIosClientId(),
    androidClientId: getGoogleWebClientId(),
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'cancel' || response.type === 'dismiss') {
      onErrorRef.current?.('Login com Google cancelado.');
      return;
    }

    if (response.type !== 'success') {
      onErrorRef.current?.('Não foi possível entrar com o Google.');
      return;
    }

    void (async () => {
      try {
        const idToken = response.params.id_token?.trim();
        if (!idToken) {
          throw new Error('Google não retornou idToken.');
        }

        const session = await loginWithGoogle(idToken);
        await onSuccessRef.current({ token: session.token, user: session.user });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Não foi possível entrar com o Google.';
        onErrorRef.current?.(message);
      }
    })();
  }, [response]);

  const login = useCallback(async () => {
    if (!request) {
      onErrorRef.current?.('Login com Google indisponível no momento.');
      return;
    }

    try {
      await promptAsync();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível abrir o login do Google.';
      onErrorRef.current?.(message);
    }
  }, [promptAsync, request]);

  return {
    loginWithGoogle: login,
    isGoogleAuthAvailable: Platform.OS !== 'web' && request != null,
  };
}
