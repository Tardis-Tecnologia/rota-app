import type { Href } from 'expo-router';

export const LOJA_DEMO_EMAIL = 'lojademo@rota.com';

/** Rotas tipadas para o Expo Router (evita erro TS quando a rota ainda não está no manifest gerado). */
export const ROUTE_COMERCIANTE = '/comerciante' as Href;
export const ROUTE_APP_HOME = '/(tabs)/home' as const;

/** Sessão local só para desenvolvimento do front (não chama a API). */
export const LOJA_DEMO_MOCK_SESSION = {
  token: 'mock-token-loja-demo',
  user: {
    id: 'mock-loja-demo',
    email: LOJA_DEMO_EMAIL,
    name: 'Loja Demo Rota',
    profile: 'LOJA',
    themeSlug: null as string | null,
  },
};

export function isLojaDemoMockEmail(email: string): boolean {
  return email.trim().toLowerCase() === LOJA_DEMO_EMAIL;
}

/** Contas que entram no painel do comércio parceiro (demo + perfis de loja na API). */
export function isComercioUser(email: string, profile: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === LOJA_DEMO_EMAIL) {
    return true;
  }
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
