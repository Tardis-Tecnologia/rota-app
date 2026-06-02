import { showVisitanteLoginDialog } from '@/contexts/VisitanteLoginDialogContext';

export function isVisitanteProfile(profile: string | undefined | null): boolean {
  return profile === 'VISITANTE';
}

export const VISITANTE_ALERT_TITLE = 'Acesso restrito';

export function visitanteFeatureMessage(feature: string): string {
  return `Para ${feature}, faça login com uma conta cadastrada.`;
}

/**
 * Exibe diálogo customizado e encaminha ao login via logout. Retorna true (ação bloqueada).
 */
export function promptVisitanteLogin(feature: string): boolean {
  showVisitanteLoginDialog({ feature });
  return true;
}
