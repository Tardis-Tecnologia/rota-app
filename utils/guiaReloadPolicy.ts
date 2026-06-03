/** Intervalo mínimo entre refetch automáticos da lista do Guia. */
export const GUIA_LIST_STALE_MS = 60_000;

/** Intervalo para atualizar detalhe do prestador em segundo plano. */
export const GUIA_PROVIDER_DETAIL_STALE_MS = 30_000;

export function shouldGuiaReload(
  lastLoadedAt: number,
  options?: { force?: boolean; hasData?: boolean },
): boolean {
  if (options?.force) return true;
  if (!options?.hasData) return true;
  return Date.now() - lastLoadedAt >= GUIA_LIST_STALE_MS;
}

export function coordsKey(coords: { latitude: number; longitude: number }): string {
  return `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;
}

/** ~2 km — mudança de região no mapa que invalida empresas do Guia. */
export const GUIA_COORDS_INVALIDATE_METERS = 2000;
