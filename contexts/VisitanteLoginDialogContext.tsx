import { VisitanteLoginDialog } from '@/components/VisitanteLoginDialog';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type VisitanteLoginDialogRequest = {
  feature: string;
  title?: string;
  message?: string;
};

type ShowVisitanteLoginDialog = (request: VisitanteLoginDialogRequest) => void;

let showVisitanteLoginDialogExternal: ShowVisitanteLoginDialog | null = null;

/** API imperativa usada por `promptVisitanteLogin` e hooks. */
export function showVisitanteLoginDialog(request: VisitanteLoginDialogRequest): void {
  if (showVisitanteLoginDialogExternal) {
    showVisitanteLoginDialogExternal(request);
    return;
  }
  // Provider ainda não montou (ex.: testes) — evita crash silencioso
  console.warn('[visitante] VisitanteLoginDialogProvider não está montado');
}

const VisitanteLoginDialogContext = createContext<ShowVisitanteLoginDialog | null>(null);

export function useVisitanteLoginDialog(): ShowVisitanteLoginDialog {
  const show = useContext(VisitanteLoginDialogContext);
  if (!show) {
    throw new Error('useVisitanteLoginDialog deve ser usado dentro de VisitanteLoginDialogProvider');
  }
  return show;
}

export function VisitanteLoginDialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<VisitanteLoginDialogRequest | null>(null);

  const show = useCallback((next: VisitanteLoginDialogRequest) => {
    setRequest(next);
  }, []);

  const dismiss = useCallback(() => {
    setRequest(null);
  }, []);

  useEffect(() => {
    showVisitanteLoginDialogExternal = show;
    return () => {
      showVisitanteLoginDialogExternal = null;
    };
  }, [show]);

  return (
    <VisitanteLoginDialogContext.Provider value={show}>
      {children}
      <VisitanteLoginDialog
        visible={request != null}
        feature={request?.feature ?? ''}
        title={request?.title}
        message={request?.message}
        onDismiss={dismiss}
      />
    </VisitanteLoginDialogContext.Provider>
  );
}
