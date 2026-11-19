import { getCommercialMetrics } from '@/services/commercialForumApi';
import {
  listCommercialCouponUsageHistory,
  listCommercialCoupons,
  summarizeCommercialCoupons,
  type CommercialCouponUsageHistoryItem,
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
  metrics: { cuponsAtivosHoje: number; engajamento: number };
  contactMetrics: CommercialMetrics | null;
  historicoUso: CommercialCouponUsageHistoryItem[];
  statsLoading: boolean;
  statsError: string | null;
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
  const [historicoUso, setHistoricoUso] = useState<CommercialCouponUsageHistoryItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

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
    setStatsError(null);
    try {
      const [coupons, history] = await Promise.all([
        listCommercialCoupons('all'),
        listCommercialCouponUsageHistory(50),
        refreshContactMetrics(),
      ]);
      const summary = summarizeCommercialCoupons(coupons);
      setCuponsAtivosCount(summary.activeCount);
      setTotalUso(summary.totalUsage);
      setHistoricoUso(history);
    } catch (e) {
      setCuponsAtivosCount(0);
      setTotalUso(0);
      setHistoricoUso([]);
      setStatsError(
        e instanceof Error ? e.message : 'Não foi possível carregar os serviços da loja.',
      );
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
      contatos: contactMetrics?.contactsTotal ?? 0,
    }),
    [contactMetrics?.contactsTotal, cuponsAtivosCount, totalUso],
  );

  const metrics = useMemo(
    () => ({
      cuponsAtivosHoje: cuponsAtivosCount,
      engajamento: contactMetrics?.forumEngagementTotal ?? 0,
    }),
    [contactMetrics?.forumEngagementTotal, cuponsAtivosCount],
  );

  const registrarUsoCupom = useCallback(() => {
    setTotalUso((n) => n + 1);
    void refreshCouponStats();
  }, [refreshCouponStats]);

  const value = useMemo<ComercianteStoreContextValue>(
    () => ({
      headerStats,
      metrics,
      contactMetrics,
      historicoUso,
      statsLoading,
      statsError,
      refreshCouponStats,
      refreshContactMetrics,
      setCuponsAtivosCount,
      registrarUsoCupom,
    }),
    [
      headerStats,
      metrics,
      contactMetrics,
      historicoUso,
      statsLoading,
      statsError,
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
