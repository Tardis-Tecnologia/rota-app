let refreshPoints: (() => void) | null = null;

export function registerRewardPointsRefresh(fn: (() => void) | null): void {
  refreshPoints = fn;
}

export function notifyRewardPointsChanged(): void {
  try {
    refreshPoints?.();
  } catch {
    // evita quebrar fluxo do voto se o listener falhar
  }
}
