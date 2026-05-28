import type { Href } from 'expo-router';

/** Rotas tipadas para o Expo Router (evita erro TS quando a rota ainda não está no manifest gerado). */
export const ROUTE_COMERCIANTE = '/comerciante' as Href;
export const ROUTE_APP_HOME = '/(tabs)/home' as const;

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
