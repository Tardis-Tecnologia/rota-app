import {
  cityToMapCenter,
  getWhitelabelCityConfig,
  type WhitelabelCityConfig,
} from '@/constants/whitelabelCity';
import { useAuth } from '@/contexts/AuthContext';
import { resolveActiveHostId } from '@/utils/whitelabelHost';
import { useMemo } from 'react';

export function useWhitelabelCity(): WhitelabelCityConfig {
  const { user } = useAuth();
  return useMemo(() => {
    const hostId = resolveActiveHostId();
    return getWhitelabelCityConfig(hostId);
  }, [user?.id]);
}

export function useWhitelabelMapCenter() {
  const city = useWhitelabelCity();
  return useMemo(() => cityToMapCenter(city), [city]);
}
