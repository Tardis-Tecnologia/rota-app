import { useAuth } from '@/contexts/AuthContext';
import {
  getPostLoginRoute,
  isComercioUser,
  ROUTE_APP_HOME,
} from '@/utils/comercioAuth';
import { type Href, router, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Único ponto de redirecionamento por sessão — evita vários Redirect/router.replace
 * competindo (glitch de “recarregar” várias vezes ao sair da conta).
 */
export function AuthNavigationSync() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const segmentKey = segments.join('/');
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rootNavigationState?.key) {
      return;
    }

    if (isLoading) {
      return;
    }

    const group = segments[0];
    const hasForumSegment = (segments as string[]).includes('forum');
    const inAuthGroup = group === '(auth)';
    const onLogin = inAuthGroup && segments[1] === 'login';
    const inComercianteGroup = group === 'comerciante';
    const onCommercialChat = group === 'ChatTab';
    const onForumStoreProfile = hasForumSegment && (segments as string[]).includes('store');
    const inForumFlow = hasForumSegment;

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

    const isCommercial = isComercioUser(user.email, user.profile);
    const homeRoute = String(getPostLoginRoute(user.email, user.profile));

    if (isCommercial) {
      if (inComercianteGroup || onCommercialChat || onForumStoreProfile || inForumFlow) {
        lastTargetRef.current = homeRoute;
        return;
      }
      lastTargetRef.current = homeRoute;
      router.replace(homeRoute as Href);
      return;
    }

    if (!isCommercial && inComercianteGroup) {
      const target = String(ROUTE_APP_HOME);
      if (lastTargetRef.current === target) {
        return;
      }
      lastTargetRef.current = target;
      router.replace(target as Href);
      return;
    }

    if (inComercianteGroup || onLogin) {
      const target = String(ROUTE_APP_HOME);
      if (lastTargetRef.current === target && !inComercianteGroup) {
        return;
      }
      lastTargetRef.current = target;
      router.replace(target as Href);
      return;
    }

    if (!inAuthGroup) {
      lastTargetRef.current = null;
    }
  }, [isLoading, rootNavigationState?.key, user, segmentKey]);

  return null;
}
