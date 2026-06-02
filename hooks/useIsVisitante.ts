import { useAuth } from '@/contexts/AuthContext';
import { isVisitanteProfile } from '@/utils/visitanteAccess';

/** Usuário com perfil VISITANTE (conta demo / prévia sem cadastro completo). */
export function useIsVisitante(): boolean {
  const { user } = useAuth();
  return isVisitanteProfile(user?.profile);
}

/** Pode curtir, comentar, publicar, resgatar pontos etc. (não é visitante). */
export function useCanInteractAsCitizen(): boolean {
  const { user } = useAuth();
  return !!user && !isVisitanteProfile(user?.profile);
}
