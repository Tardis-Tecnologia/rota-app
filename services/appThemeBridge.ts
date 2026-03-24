let refreshFromApi: (() => Promise<void>) | null = null;

export function registerAppThemeRefresh(fn: (() => Promise<void>) | null): void {
  refreshFromApi = fn;
}

export async function refreshAppThemeAfterLogin(): Promise<void> {
  await refreshFromApi?.();
}
