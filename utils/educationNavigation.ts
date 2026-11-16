import { router, type Href } from 'expo-router';

/** Volta no histórico real do stack; se aberto sem histórico, vai para Serviços. */
export function educationGoBack(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/services' as Href);
}
