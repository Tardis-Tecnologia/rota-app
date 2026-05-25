import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/comercioAuth';
import { type Href, router, useSegments } from 'expo-router';
import { useLayoutEffect, useRef } from 'react';

/**
 * Único ponto de redirecionamento por sessão — evita vários Redirect/router.replace
 * competindo (glitch de “recarregar” várias vezes ao sair da conta).
 */
export function AuthNavigationSync() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const segmentKey = segments.join('/');
  const lastTargetRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (isLoading) {
      return;
    }

    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const onLogin = inAuthGroup && segments[1] === 'login';

    if (!user) {
      if (inAuthGroup) {
        lastTargetRef.current = '/(auth)/login';
        return;
      }
      const target = '/(auth)/login';
      if (lastTargetRef.current === target) {
        return;
      }
      lastTargetRef.current = target;
      router.replace(target);
      return;
    }

    if (onLogin) {
      const target = String(getPostLoginRoute(user.email, user.profile));
      if (lastTargetRef.current === target) {
        return;
      }
      lastTargetRef.current = target;
      router.replace(target as Href);
      return;
    }

    if (!inAuthGroup) {
      lastTargetRef.current = null;
    }
  }, [isLoading, user, segmentKey]);

  return null;
}
