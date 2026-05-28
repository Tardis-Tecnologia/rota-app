import CpfRequiredModal from '@/components/CpfRequiredModal';
import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import RewardsModalBody from '@/components/rewards/RewardsModalBody';
import RewardsModalHeader from '@/components/rewards/RewardsModalHeader';
import RewardRedemptionHistory from '@/components/rewards/RewardRedemptionHistory';
import Toast, { type ToastType } from '@/components/Toast';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getWhitelabelHostId } from '@/services/authApi';
import {
  listActiveCommercialCouponsCatalog,
  type CommercialCouponCatalogItem,
} from '@/services/commercialCouponsApi';
import {
  getRewardRedemptions,
  getRewards,
  getUserRewardPoints,
  redeemReward,
  RewardApiError,
  type RewardRedemptionItem,
} from '@/services/rewardService';
import { registerRewardPointsRefresh } from '@/services/rewardPointsBridge';
import type { CatalogReward, RewardsFilterTab } from '@/types/index';
import {
  filterRewardsByTab,
  getRequiredBalanceForRedeem,
  latestCouponCodeForReward,
  mapRewardFromApi,
  storeCouponActiveHoldIds,
} from '@/utils/rewardHelpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const PAGE_SIZE = 10;

interface PointsBadgeProps {
  points?: number;
  onRedeem?: (rewardId: string, cost: number, newBalance: number) => void;
}

interface PendingRedeemConfirmation {
  rewardId: string;
  cost: number;
  rewardName: string;
}

interface InsufficientBalanceInfo {
  rewardName: string;
  requiredPoints: number;
}

export default function PointsBadge({
  points: initialPoints = 0,
  onRedeem,
}: PointsBadgeProps) {
  const { user } = useAuth();
  const cpfKnown = user?.cpf !== undefined;
  const hasCpf = Boolean(user?.cpf && user.cpf.replace(/\D/g, '').length === 11);
  const needsCpf = cpfKnown && !hasCpf;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(initialPoints);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [redeemedRewards, setRedeemedRewards] = useState<Set<string>>(new Set());
  const [rewards, setRewards] = useState<CatalogReward[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [loadingMoreRewards, setLoadingMoreRewards] = useState(false);
  const [hasMoreRewards, setHasMoreRewards] = useState(false);
  const [rewardsError, setRewardsError] = useState<string | null>(null);
  const [rewardActionError, setRewardActionError] = useState<string | null>(null);
  const [loadingRedeemId, setLoadingRedeemId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RewardRedemptionItem[]>([]);
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastKey, setToastKey] = useState(0);
  const [rewardsFilterTab, setRewardsFilterTab] = useState<RewardsFilterTab>('cupons_lojas');
  const [commercialCoupons, setCommercialCoupons] = useState<CommercialCouponCatalogItem[]>([]);
  const [isLoadingCommercialCoupons, setIsLoadingCommercialCoupons] = useState(false);
  const [commercialCouponsError, setCommercialCouponsError] = useState<string | null>(null);
  const [couponCodesFromRedeem, setCouponCodesFromRedeem] = useState<Record<string, string>>({});
  const [pendingRedeemConfirmation, setPendingRedeemConfirmation] =
    useState<PendingRedeemConfirmation | null>(null);
  const [insufficientBalanceInfo, setInsufficientBalanceInfo] =
    useState<InsufficientBalanceInfo | null>(null);
  const [showRedemptionHistory, setShowRedemptionHistory] = useState(false);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(300);

  const showActionToast = (message: string, type: ToastType) => {
    setToastVisible(false);
    setToastMessage(message);
    setToastType(type);
    setToastKey((prev) => prev + 1);
    setTimeout(() => setToastVisible(true), 40);
  };

  const loadPoints = async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoadingPoints(true);
    }
    setPointsError(null);
    try {
      const data = await getUserRewardPoints();
      if (typeof data.rewardPoints === 'number') {
        setCurrentPoints(data.rewardPoints);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível carregar seu saldo';
      setPointsError(message);
    } finally {
      if (showLoading) {
        setIsLoadingPoints(false);
      }
    }
  };

  const loadPointsRef = useRef(loadPoints);
  loadPointsRef.current = loadPoints;

  useEffect(() => {
    registerRewardPointsRefresh(() => {
      void loadPointsRef.current(false);
    });
    return () => registerRewardPointsRefresh(null);
  }, []);

  const rewardsLengthRef = useRef(0);
  rewardsLengthRef.current = rewards.length;

  const fetchRewardsPage = useCallback(async (offset: number) => {
    return getRewards({ init: offset, end: offset + PAGE_SIZE });
  }, []);

  const loadRewards = useCallback(async () => {
    setIsLoadingRewards(true);
    setRewardsError(null);
    setHasMoreRewards(false);
    try {
      const list = await fetchRewardsPage(0);
      const mapped = list.map(mapRewardFromApi);
      setRewards(mapped);
      setHasMoreRewards(list.length === PAGE_SIZE);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível carregar recompensas';
      setRewardsError(message);
      setRewards([]);
      setHasMoreRewards(false);
    } finally {
      setIsLoadingRewards(false);
    }
  }, [fetchRewardsPage]);

  const loadMoreRewards = useCallback(async () => {
    if (loadingMoreRewards || isLoadingRewards || !hasMoreRewards) return;
    setLoadingMoreRewards(true);
    try {
      const offset = rewardsLengthRef.current;
      const list = await fetchRewardsPage(offset);
      const mapped = list.map(mapRewardFromApi);
      setRewards((prev) => [...prev, ...mapped]);
      setHasMoreRewards(list.length === PAGE_SIZE);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível carregar mais recompensas';
      setRewardsError(message);
      setHasMoreRewards(false);
    } finally {
      setLoadingMoreRewards(false);
    }
  }, [fetchRewardsPage, hasMoreRewards, isLoadingRewards, loadingMoreRewards]);

  const handleEndReached = useCallback(() => {
    if (loadingMoreRewards || isLoadingRewards || !hasMoreRewards) return;
    void loadMoreRewards();
  }, [hasMoreRewards, isLoadingRewards, loadMoreRewards, loadingMoreRewards]);

  const loadRedemptions = async () => {
    if (!user?.id) {
      setRedemptions([]);
      setRedeemedRewards(new Set());
      return;
    }
    try {
      const data = await getRewardRedemptions(user.id);
      setRedemptions(data);
      setRedeemedRewards(new Set(data.map((item) => item.rewardId)));
    } catch {
      setRedemptions([]);
    }
  };

  const loadCommercialCoupons = useCallback(async () => {
    setIsLoadingCommercialCoupons(true);
    setCommercialCouponsError(null);
    try {
      const hostId = getWhitelabelHostId();
      const list = await listActiveCommercialCouponsCatalog(hostId);
      setCommercialCoupons(list);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar cupons de lojas parceiras';
      setCommercialCouponsError(message);
      setCommercialCoupons([]);
    } finally {
      setIsLoadingCommercialCoupons(false);
    }
  }, []);

  const openModal = () => {
    setIsModalVisible(true);
    modalOpacity.value = withTiming(1, { duration: 200 });
    modalTranslateY.value = withTiming(0, { duration: 200 });
    setRewardActionError(null);
    setCouponCodesFromRedeem({});
    setRewardsFilterTab('cupons_lojas');
    setShowRedemptionHistory(false);
    if (user?.profile !== 'VISITANTE') {
      void loadRewards();
      void loadCommercialCoupons();
      void loadPoints(false);
      void loadRedemptions();
    }
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalTranslateY.value = withTiming(300, { duration: 200 });
    setTimeout(() => {
      setIsModalVisible(false);
    }, 200);
  };

  const earnRewardsFiltered = useMemo(
    () => filterRewardsByTab(rewards, redeemedRewards, 'meus_resgates'),
    [rewards, redeemedRewards],
  );

  const storeCouponHoldIds = useMemo(
    () => storeCouponActiveHoldIds(redemptions, rewards),
    [redemptions, rewards],
  );

  const couponCodeByRewardId = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of rewards) {
      const code = latestCouponCodeForReward(r.id, redemptions);
      if (code) out[r.id] = code;
    }
    return { ...out, ...couponCodesFromRedeem };
  }, [rewards, redemptions, couponCodesFromRedeem]);

  const executeRedeem = async (rewardId: string, cost: number) => {
    setLoadingRedeemId(rewardId);
    try {
      const result = await redeemReward(rewardId);
      const newBalance =
        typeof result.rewardPoints === 'number' ? result.rewardPoints : currentPoints - cost;
      setCurrentPoints(newBalance);
      setRedeemedRewards((prev) => new Set(prev).add(rewardId));
      const cc = typeof result.couponCode === 'string' ? result.couponCode.trim() : '';
      if (cc) {
        setCouponCodesFromRedeem((prev) => ({ ...prev, [rewardId]: cc }));
      }
      await loadRedemptions();
      if (cost < 0) {
        showActionToast(
          `Resgate confirmado! ${Math.abs(cost).toLocaleString('pt-BR')} pontos foram descontados.`,
          'success',
        );
      } else if (cost > 0) {
        showActionToast(
          `Pontos aplicados com sucesso! +${cost.toLocaleString('pt-BR')} pontos.`,
          'success',
        );
      } else {
        showActionToast('Resgate realizado com sucesso!', 'success');
      }
      if (onRedeem) {
        onRedeem(rewardId, cost, newBalance);
      }
    } catch (error) {
      if (error instanceof RewardApiError) {
        if (error.code === 'INSUFFICIENT_BALANCE') {
          const message = 'Saldo insuficiente para resgatar esta recompensa.';
          setRewardActionError(message);
          showActionToast(message, 'warning');
        } else if (error.code === 'USER_WITHOUT_CPF') {
          setShowCpfModal(true);
        } else if (error.code === 'REWARD_INACTIVE') {
          const message = 'Esta recompensa está inativa no momento.';
          setRewardActionError(message);
          showActionToast(message, 'warning');
        } else {
          const message = error.message || 'Falha ao resgatar recompensa.';
          setRewardActionError(message);
          showActionToast(message, 'error');
        }
      } else {
        const message = 'Falha ao resgatar recompensa.';
        setRewardActionError(message);
        showActionToast(message, 'error');
      }
      await loadPoints(false);
    } finally {
      setLoadingRedeemId(null);
    }
  };

  const handleRedeem = async (rewardId: string, cost: number) => {
    setRewardActionError(null);
    if (needsCpf) {
      setShowCpfModal(true);
      return;
    }

    const rewardPreview = rewards.find((r) => r.id === rewardId);
    const isStoreCoupon = (rewardPreview?.value ?? 0) < 0;
    if (isStoreCoupon) {
      if (storeCouponHoldIds.has(rewardId)) return;
    } else if (redeemedRewards.has(rewardId)) {
      return;
    }

    const reward = rewardPreview;
    if (reward?.disabled) {
      const message = 'Esta recompensa está inativa no momento.';
      setRewardActionError(message);
      showActionToast(message, 'warning');
      return;
    }

    const requiredBalance = getRequiredBalanceForRedeem(cost);
    if (requiredBalance > 0 && currentPoints < requiredBalance) {
      setInsufficientBalanceInfo({
        rewardName: reward?.name ?? 'esta recompensa',
        requiredPoints: requiredBalance,
      });
      return;
    }

    if (cost < 0) {
      setPendingRedeemConfirmation({
        rewardId,
        cost,
        rewardName: reward?.name ?? 'esta recompensa',
      });
      return;
    }

    await executeRedeem(rewardId, cost);
  };

  const handleConfirmRedeem = async () => {
    if (!pendingRedeemConfirmation) return;
    const { rewardId, cost } = pendingRedeemConfirmation;
    setPendingRedeemConfirmation(null);
    await executeRedeem(rewardId, cost);
  };

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value * 0.4,
  }));

  useEffect(() => {
    void loadPoints();
  }, []);

  return (
    <>
      <TouchableOpacity onPress={openModal} activeOpacity={0.85} style={styles.container}>
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.left}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="crown-outline" size={18} color={AppColors.text.white} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.label}>Seus pontos</Text>
              {isLoadingPoints ? (
                <ActivityIndicator size="small" color={AppColors.text.white} />
              ) : (
                <Text style={styles.points}>{currentPoints.toLocaleString('pt-BR')}</Text>
              )}
            </View>
          </View>

          <View style={styles.right}>
            <View style={styles.giftWrap}>
              <Ionicons name="gift-outline" size={18} color={AppColors.text.white} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} pointerEvents="box-none">
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
          </Animated.View>

          <Animated.View style={[styles.modalPanel, modalAnimatedStyle]}>
            <View style={styles.modalPanelInner}>
              <RewardsModalHeader
                currentPoints={currentPoints}
                needsCpf={needsCpf}
                isLoadingPoints={isLoadingPoints}
                pointsError={pointsError}
                onClose={closeModal}
                onRetryLoadPoints={() => {
                  void loadPoints();
                }}
                filterTab={rewardsFilterTab}
                onFilterChange={setRewardsFilterTab}
                isHistoryView={showRedemptionHistory}
                showFilterTabs={!showRedemptionHistory}
                onHistoryPress={() => setShowRedemptionHistory((v) => !v)}
              />

              <View style={styles.rewardsListContainer}>
                {showRedemptionHistory ? (
                  <ScrollView
                    style={styles.historyScroll}
                    contentContainerStyle={styles.historyScrollContent}
                    showsVerticalScrollIndicator
                  >
                    <RewardRedemptionHistory redemptions={redemptions} catalog={rewards} />
                  </ScrollView>
                ) : (
                  <RewardsModalBody
                    filterTab={rewardsFilterTab}
                    currentPoints={currentPoints}
                    rewardActionError={rewardActionError}
                    rewards={rewards}
                    filteredRewards={earnRewardsFiltered}
                    commercialCoupons={commercialCoupons}
                    storeCouponHoldIds={storeCouponHoldIds}
                    couponCodeByRewardId={couponCodeByRewardId}
                    loadingRedeemId={loadingRedeemId}
                    isLoadingRewards={isLoadingRewards}
                    isLoadingCommercialCoupons={isLoadingCommercialCoupons}
                    rewardsError={rewardsError}
                    commercialCouponsError={commercialCouponsError}
                    loadingMore={loadingMoreRewards}
                    onEndReached={handleEndReached}
                    onRedeem={handleRedeem}
                    onLockedRewardPress={(reward) =>
                      setInsufficientBalanceInfo({
                        rewardName: reward.name,
                        requiredPoints: Math.abs(reward.value ?? 0),
                      })
                    }
                    onRetryLoadRewards={() => {
                      void loadRewards();
                    }}
                    onRetryLoadCommercialCoupons={() => {
                      void loadCommercialCoupons();
                    }}
                    onCouponCopied={() => {
                      showActionToast('Código copiado!', 'success');
                    }}
                    citizenUserId={user?.id}
                  />
                )}
              </View>
              <VisitanteLoginOverlay message="A loja de recompensas e o resgate de pontos exigem login com uma conta cadastrada." />
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(pendingRedeemConfirmation)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingRedeemConfirmation(null)}
      >
        <View style={styles.confirmOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPendingRedeemConfirmation(null)}
          />
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="help-circle" size={24} color={AppColors.palette.purple.base} />
            </View>
            <Text style={styles.confirmTitle}>Quase lá!</Text>
            <Text style={styles.confirmMessage}>
              Você vai gastar{' '}
              <Text style={styles.confirmPointsText}>
                {Math.abs(pendingRedeemConfirmation?.cost ?? 0).toLocaleString('pt-BR')} pontos
              </Text>{' '}
              para resgatar{' '}
              <Text style={styles.confirmRewardText}>
                {pendingRedeemConfirmation?.rewardName ?? 'esta recompensa'}
              </Text>
              .
            </Text>
            <Text style={styles.confirmBalanceHint}>
              Saldo atual: {currentPoints.toLocaleString('pt-BR')} pontos
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setPendingRedeemConfirmation(null)}
                activeOpacity={0.8}
                disabled={Boolean(loadingRedeemId)}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmAcceptButton}
                onPress={() => {
                  void handleConfirmRedeem();
                }}
                activeOpacity={0.8}
                disabled={Boolean(loadingRedeemId)}
              >
                {loadingRedeemId ? (
                  <ActivityIndicator size="small" color={AppColors.text.white} />
                ) : (
                  <Text style={styles.confirmAcceptText}>Confirmar resgate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(insufficientBalanceInfo)}
        transparent
        animationType="fade"
        onRequestClose={() => setInsufficientBalanceInfo(null)}
      >
        <View style={styles.confirmOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setInsufficientBalanceInfo(null)}
          />
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="lock-closed" size={22} color={AppColors.status.warning} />
            </View>
            <Text style={styles.confirmTitle}>Resgate bloqueado</Text>
            <Text style={styles.confirmMessage}>
              você não possui saldo suficiente para resgatar essa recompensa.
            </Text>
            <Text style={styles.confirmBalanceHint}>
              Necessário:{' '}
              {(insufficientBalanceInfo?.requiredPoints ?? 0).toLocaleString('pt-BR')} pontos para{' '}
              {insufficientBalanceInfo?.rewardName ?? 'este item'}.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setInsufficientBalanceInfo(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmAcceptButton}
                onPress={() => {
                  setInsufficientBalanceInfo(null);
                  setRewardsFilterTab('meus_resgates');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmAcceptText}>Ganhar pontos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CpfRequiredModal
        visible={showCpfModal}
        title="CPF obrigatório"
        message="Para resgatar recompensas, complete seu CPF no cadastro."
        onClose={() => setShowCpfModal(false)}
        onCompleteProfile={() => {
          setShowCpfModal(false);
          router.push('/edit-account');
        }}
      />
      <Toast
        key={toastKey}
        message={toastMessage}
        visible={toastVisible}
        type={toastType}
        duration={2200}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  points: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: AppColors.text.white,
  },
  right: {
    marginLeft: 12,
  },
  giftWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.shadow,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: '#f1f5f9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    flexDirection: 'column',
  },
  modalPanelInner: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f1f5f9',
  },
  rewardsListContainer: {
    flex: 1,
    minHeight: 0,
  },
  historyScroll: {
    flex: 1,
  },
  historyScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: AppColors.background.default,
    padding: 20,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(147, 51, 234, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text.secondary,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  confirmPointsText: {
    fontWeight: '800',
    color: AppColors.status.error,
  },
  confirmRewardText: {
    fontWeight: '700',
    color: AppColors.text.primary,
  },
  confirmBalanceHint: {
    marginTop: 10,
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: AppColors.background.default,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  confirmAcceptButton: {
    flex: 1.4,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: AppColors.palette.purple.base,
  },
  confirmAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text.white,
  },
});
