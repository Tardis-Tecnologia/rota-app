import { ComercianteStoreProvider } from '@/contexts/ComercianteStoreContext';
import React from 'react';

/** Garante o contexto da loja em cada tela do fluxo comerciante (tabs do Expo Router). */
export default function ComercianteScreenProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ComercianteStoreProvider>{children}</ComercianteStoreProvider>;
}
