import CpfRequiredModal from '@/components/CpfRequiredModal';
import RewardsModalBody from '@/components/rewards/RewardsModalBody';
import RewardsModalHeader from '@/components/rewards/RewardsModalHeader';
import Toast, { type ToastType } from '@/components/Toast';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    getRewardRedemptions,
    getRewards,
    getUserRewardPoints,
    redeemReward,
    RewardApiError,
    type RewardRedemptionItem,
} from '@/services/rewardService';
import type { CatalogReward, RewardsFilterTab } from '@/types/index';
import {
    filterRewardsByTab,
    getRequiredBalanceForRedeem,
    mapRewardFromApi,
} from '@/utils/rewardHelpers';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
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
  const [rewardsFilterTab, setRewardsFilterTab] = useState<RewardsFilterTab>('resgatar');
  const [pendingRedeemConfirmation, setPendingRedeemConfirmation] =
    useState<PendingRedeemConfirmation | null>(null);
  const [insufficientBalanceInfo, setInsufficientBalanceInfo] =
    useState<InsufficientBalanceInfo | null>(null);

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
    if (rewardsFilterTab === 'historico') return;
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
  }, [fetchRewardsPage, hasMoreRewards, isLoadingRewards, loadingMoreRewards, rewardsFilterTab]);

  const handleEndReached = useCallback(() => {
    if (loadingMoreRewards || isLoadingRewards || !hasMoreRewards) return;
    if (rewardsFilterTab === 'historico') return;
    void loadMoreRewards();
  }, [hasMoreRewards, isLoadingRewards, loadMoreRewards, loadingMoreRewards, rewardsFilterTab]);

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

  const openModal = () => {
    setIsModalVisible(true);
    modalOpacity.value = withTiming(1, { duration: 200 });
    modalTranslateY.value = withTiming(0, { duration: 200 });
    setRewardActionError(null);
    setRewardsFilterTab('resgatar');
    void loadRewards();
    void loadPoints(false);
    void loadRedemptions();
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalTranslateY.value = withTiming(300, { duration: 200 });
    setTimeout(() => {
      setIsModalVisible(false);
    }, 200);
  };

  const filteredRewardsForTab = useMemo(
    () => filterRewardsByTab(rewards, redeemedRewards, rewardsFilterTab),
    [rewards, redeemedRewards, rewardsFilterTab],
  );

  const executeRedeem = async (rewardId: string, cost: number) => {
    setLoadingRedeemId(rewardId);
    try {
      const result = await redeemReward(rewardId);
      const newBalance =
        typeof result.rewardPoints === 'number' ? result.rewardPoints : currentPoints - cost;
      setCurrentPoints(newBalance);
      setRedeemedRewards((prev) => new Set(prev).add(rewardId));
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

    if (redeemedRewards.has(rewardId)) {
      return;
    }

    const reward = rewards.find((r) => r.id === rewardId);
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
      <TouchableOpacity onPress={openModal} activeOpacity={0.8} style={styles.badgeContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          {isLoadingPoints ? (
            <ActivityIndicator size="small" color={AppColors.text.white} />
          ) : (
            <>
              <Ionicons name="star-outline" size={12} color={AppColors.text.white} />
              <Text style={styles.badgeText}>{currentPoints.toLocaleString('pt-BR')}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} pointerEvents="box-none">
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
          </Animated.View>

          <Animated.View style={[styles.modalPanel, modalAnimatedStyle]}>
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
            />

            <View style={styles.rewardsListContainer}>
              <RewardsModalBody
                filterTab={rewardsFilterTab}
                currentPoints={currentPoints}
                rewardActionError={rewardActionError}
                redemptions={redemptions}
                rewards={rewards}
                filteredRewards={filteredRewardsForTab}
                redeemedIds={redeemedRewards}
                loadingRedeemId={loadingRedeemId}
                isLoadingRewards={isLoadingRewards}
                rewardsError={rewardsError}
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
              />
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
                  setRewardsFilterTab('ganhar');
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
  badgeContainer: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.text.white,
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
    backgroundColor: AppColors.background.light,
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
  rewardsListContainer: {
    flex: 1,
    minHeight: 0,
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
