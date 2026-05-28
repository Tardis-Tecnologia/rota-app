import {
  COMERCIANTE_HEADER_STATS,
  COMERCIANTE_METRICS,
  COMERCIANTE_NOTIFICACOES,
  type ComercianteNotificacao,
} from '@/data/comercianteMock';
import {
  listCommercialCoupons,
  summarizeCommercialCoupons,
} from '@/services/commercialCouponsApi';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ComercianteHeaderStats = {
  cupons: number;
  uso: number;
  contatos: number;
};

type ComercianteStoreContextValue = {
  headerStats: ComercianteHeaderStats;
  metrics: typeof COMERCIANTE_METRICS & { cuponsAtivosHoje: number };
  notificacoes: ComercianteNotificacao[];
  novasNotificacoes: number;
  statsLoading: boolean;
  refreshCouponStats: () => Promise<void>;
  setCuponsAtivosCount: (count: number) => void;
  registrarUsoCupom: () => void;
};

const ComercianteStoreContext = createContext<ComercianteStoreContextValue | null>(null);

export function ComercianteStoreProvider({ children }: { children: React.ReactNode }) {
  const [cuponsAtivosCount, setCuponsAtivosCount] = useState(0);
  const [totalUso, setTotalUso] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshCouponStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const coupons = await listCommercialCoupons('all');
      const summary = summarizeCommercialCoupons(coupons);
      setCuponsAtivosCount(summary.activeCount);
      setTotalUso(summary.totalUsage);
    } catch {
      setCuponsAtivosCount(0);
      setTotalUso(0);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCouponStats();
  }, [refreshCouponStats]);

  const headerStats = useMemo<ComercianteHeaderStats>(
    () => ({
      cupons: cuponsAtivosCount,
      uso: totalUso,
      contatos: COMERCIANTE_HEADER_STATS.contatos,
    }),
    [cuponsAtivosCount, totalUso],
  );

  const metrics = useMemo(
    () => ({
      cuponsAtivosHoje: cuponsAtivosCount,
      engajamento: COMERCIANTE_METRICS.engajamento,
    }),
    [cuponsAtivosCount],
  );

  const registrarUsoCupom = useCallback(() => {
    setTotalUso((n) => n + 1);
    void refreshCouponStats();
  }, [refreshCouponStats]);

  const value = useMemo<ComercianteStoreContextValue>(
    () => ({
      headerStats,
      metrics,
      notificacoes: COMERCIANTE_NOTIFICACOES,
      novasNotificacoes: COMERCIANTE_NOTIFICACOES.length,
      statsLoading,
      refreshCouponStats,
      setCuponsAtivosCount,
      registrarUsoCupom,
    }),
    [
      headerStats,
      metrics,
      statsLoading,
      refreshCouponStats,
      registrarUsoCupom,
    ],
  );

  return (
    <ComercianteStoreContext.Provider value={value}>{children}</ComercianteStoreContext.Provider>
  );
}

export function useComercianteStore(): ComercianteStoreContextValue {
  const ctx = useContext(ComercianteStoreContext);
  if (!ctx) {
    throw new Error('useComercianteStore deve ser usado dentro de ComercianteStoreProvider');
  }
  return ctx;
}
