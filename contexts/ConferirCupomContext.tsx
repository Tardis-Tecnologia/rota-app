import ConferirCupomModal from '@/components/comerciante/ConferirCupomModal';
import { useComercianteStore } from '@/contexts/ComercianteStoreContext';
import type { MarkCouponUsedResult } from '@/services/commercialCouponsApi';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';

type ConferirCupomContextValue = {
  openConferirCupom: () => void;
};

const ConferirCupomContext = createContext<ConferirCupomContextValue | null>(null);

export function ConferirCupomProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const { registrarUsoCupom, refreshCouponStats } = useComercianteStore();

  const handleSuccess = useCallback(
    (result: MarkCouponUsedResult) => {
      registrarUsoCupom();
      void refreshCouponStats();
      const title =
        result.status === 'already_used'
          ? 'Cliente já usou este cupom'
          : 'Uso registrado com sucesso';
      const message =
        result.status === 'already_used'
          ? `Este cliente já havia utilizado o cupom ${result.code}.`
          : `Cupom ${result.code} validado. Total de usos desta campanha: ${result.usageCount}.`;
      Alert.alert(title, message);
    },
    [registrarUsoCupom, refreshCouponStats],
  );

  const value = useMemo<ConferirCupomContextValue>(
    () => ({
      openConferirCupom: () => setVisible(true),
    }),
    [],
  );

  return (
    <ConferirCupomContext.Provider value={value}>
      {children}
      <ConferirCupomModal
        visible={visible}
        onClose={() => setVisible(false)}
        onSuccess={handleSuccess}
      />
    </ConferirCupomContext.Provider>
  );
}

export function useConferirCupom(): ConferirCupomContextValue {
  const ctx = useContext(ConferirCupomContext);
  if (!ctx) {
    throw new Error('useConferirCupom deve ser usado dentro de ConferirCupomProvider');
  }
  return ctx;
}
