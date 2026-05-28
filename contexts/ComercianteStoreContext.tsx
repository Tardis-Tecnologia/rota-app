import {
  COMERCIANTE_HEADER_STATS,
  COMERCIANTE_METRICS,
  COMERCIANTE_NOTIFICACOES,
  type ComercianteNotificacao,
} from '@/data/comercianteMock';
import { getCommercialMetrics } from '@/services/commercialForumApi';
import {
  listCommercialCoupons,
  summarizeCommercialCoupons,
} from '@/services/commercialCouponsApi';
import type { CommercialMetrics } from '@/types/forumCommercial';
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
  contactMetrics: CommercialMetrics | null;
  notificacoes: ComercianteNotificacao[];
  novasNotificacoes: number;
  statsLoading: boolean;
  refreshCouponStats: () => Promise<void>;
  refreshContactMetrics: () => Promise<void>;
  setCuponsAtivosCount: (count: number) => void;
  registrarUsoCupom: () => void;
};

const ComercianteStoreContext = createContext<ComercianteStoreContextValue | null>(null);

export function ComercianteStoreProvider({ children }: { children: React.ReactNode }) {
  const [cuponsAtivosCount, setCuponsAtivosCount] = useState(0);
  const [totalUso, setTotalUso] = useState(0);
  const [contactMetrics, setContactMetrics] = useState<CommercialMetrics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshContactMetrics = useCallback(async () => {
    try {
      const data = await getCommercialMetrics();
      setContactMetrics(data);
    } catch {
      setContactMetrics(null);
    }
  }, []);

  const refreshCouponStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [coupons] = await Promise.all([
        listCommercialCoupons('all'),
        refreshContactMetrics(),
      ]);
      const summary = summarizeCommercialCoupons(coupons);
      setCuponsAtivosCount(summary.activeCount);
      setTotalUso(summary.totalUsage);
    } catch {
      setCuponsAtivosCount(0);
      setTotalUso(0);
    } finally {
      setStatsLoading(false);
    }
  }, [refreshContactMetrics]);

  useEffect(() => {
    void refreshCouponStats();
  }, [refreshCouponStats]);

  const headerStats = useMemo<ComercianteHeaderStats>(
    () => ({
      cupons: cuponsAtivosCount,
      uso: totalUso,
      contatos: contactMetrics?.contactsTotal ?? COMERCIANTE_HEADER_STATS.contatos,
    }),
    [contactMetrics?.contactsTotal, cuponsAtivosCount, totalUso],
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
        contactMetrics,
        refreshCouponStats,
        refreshContactMetrics,
        setCuponsAtivosCount,
        registrarUsoCupom,
    }),
    [
      headerStats,
      metrics,
      contactMetrics,
      statsLoading,
      refreshCouponStats,
      refreshContactMetrics,
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
