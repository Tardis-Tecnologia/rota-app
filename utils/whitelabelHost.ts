import { getWhitelabelCityConfig } from '@/constants/whitelabelCity';
import { getAuthToken, getWhitelabelHostId } from '@/services/apiConfig';
import { parseJwtAccessTokenPayload } from '@/services/jwtAccessTokenClaims';

/** Host ativo: JWT (após login) ou EXPO_PUBLIC_HOST_ID do build. */
export function resolveActiveHostId(): string {
  const token = getAuthToken();
  if (token) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      const fromJwt = claims.hostId?.trim();
      if (fromJwt) return fromJwt;
    } catch {
      // token inválido — cai no env
    }
  }
  return getWhitelabelHostId();
}

export function resolveActiveCityConfig() {
  return getWhitelabelCityConfig(resolveActiveHostId());
}
