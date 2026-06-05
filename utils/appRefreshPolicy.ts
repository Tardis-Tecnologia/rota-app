/** Intervalo mínimo entre refetch automáticos ao ganhar foco (tabs, hooks globais). */
export const APP_FOCUS_STALE_MS = 60_000;

/** Reutiliza última posição GPS do Explorar por este intervalo. */
export const EXPLORE_GPS_STALE_MS = 5 * 60_000;

export function shouldAppRefetch(
  lastLoadedAt: number,
  options?: { force?: boolean; hasData?: boolean },
): boolean {
  if (options?.force) return true;
  if (!options?.hasData) return true;
  return Date.now() - lastLoadedAt >= APP_FOCUS_STALE_MS;
}
