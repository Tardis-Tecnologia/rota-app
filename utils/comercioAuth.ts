import { getAuthToken } from '@/services/authApi';
import { parseJwtAccessTokenPayload } from '@/services/jwtAccessTokenClaims';
import type { Href } from 'expo-router';

/** Rotas tipadas para o Expo Router (evita erro TS quando a rota ainda não está no manifest gerado). */
export const ROUTE_COMERCIANTE = '/comerciante' as Href;
export const ROUTE_COMERCIANTE_MENSAGENS = '/comerciante/mensagens' as Href;
export const ROUTE_CITIZEN_MESSAGES = '/(tabs)/messages' as const;
export const ROUTE_APP_HOME = '/(tabs)/home' as const;

/** JWT emitido para conta comercial (loja), não cidadão. */
export function isCommercialAccessToken(token?: string | null): boolean {
  const raw = token ?? getAuthToken();
  if (!raw) return false;
  try {
    const claims = parseJwtAccessTokenPayload(raw);
    return claims.accountType === 'commercial';
  } catch {
    return false;
  }
}

export function isComercioUser(_email: string, profile: string): boolean {
  const p = profile.trim().toUpperCase();
  return (
    p === 'LOJA' ||
    p === 'COMERCIO' ||
    p === 'COMERCIANTE' ||
    p === 'ESTABELECIMENTO' ||
    p.includes('LOJA') ||
    p.includes('COMERCIO')
  );
}

export function getPostLoginRoute(email: string, profile: string): Href {
  return isComercioUser(email, profile) ? ROUTE_COMERCIANTE : ROUTE_APP_HOME;
}

export function resolveMessagesInboxRoute(options: {
  returnTo?: string | string[];
  email?: string;
  profile?: string;
}): Href {
  const raw = options.returnTo;
  const explicit = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (explicit) {
    return explicit as Href;
  }
  if (
    isCommercialAccessToken() ||
    isComercioUser(options.email ?? '', options.profile ?? '')
  ) {
    return ROUTE_COMERCIANTE_MENSAGENS;
  }
  return ROUTE_CITIZEN_MESSAGES as Href;
}
