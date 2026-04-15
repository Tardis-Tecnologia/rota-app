export interface JwtAccessTokenClaims {
  sub: string;
  userId?: string;
  email?: string;
  hostId?: string | null;
  host?: string | null;
}

function base64UrlToBinary(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

export function parseJwtAccessTokenPayload(token: string): JwtAccessTokenClaims {
  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) {
    throw new Error('JWT malformado');
  }
  const json = base64UrlToBinary(parts[1]);
  return JSON.parse(json) as JwtAccessTokenClaims;
}
