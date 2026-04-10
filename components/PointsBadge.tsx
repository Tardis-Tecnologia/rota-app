import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import CpfRequiredModal from '@/components/CpfRequiredModal';
import Toast, { type ToastType } from '@/components/Toast';
import {
  getRewardRedemptions,
  getRewards,
  getUserRewardPoints,
  redeemReward,
  RewardApiError,
  type RewardRedemptionItem,
  type RewardItem as ApiRewardItem,
} from '@/services/rewardService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
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

interface Reward {
  id: string;
  name: string;
  description: string;
  value: number;
  disabled?: boolean;
}

interface PointsBadgeProps {
  points?: number;
  onRedeem?: (rewardId: string, cost: number, newBalance: number) => void;
}

function mapRewardFromApi(item: ApiRewardItem): Reward {
  return {
    id: item.id,
    name: item.name,
    description: item.description?.trim() || '',
    value: item.value,
  };
}

function getRequiredBalanceForRedeem(value: number): number {
  return value < 0 ? Math.abs(value) : 0;
}

function formatRedemptionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [rewardsError, setRewardsError] = useState<string | null>(null);
  const [rewardActionError, setRewardActionError] = useState<string | null>(null);
  const [loadingRedeemId, setLoadingRedeemId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RewardRedemptionItem[]>([]);
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastKey, setToastKey] = useState(0);
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

  const loadRewards = async () => {
    setIsLoadingRewards(true);
    setRewardsError(null);
    try {
      const apiRewards = await getRewards();
      setRewards(apiRewards.map(mapRewardFromApi));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar recompensas';
      setRewardsError(message);
      setRewards([]);
    } finally {
      setIsLoadingRewards(false);
    }
  };

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
      // Histórico é complementar neste momento. Não bloqueia a loja.
      setRedemptions([]);
    }
  };

  const openModal = () => {
    setIsModalVisible(true);
    modalOpacity.value = withTiming(1, { duration: 200 });
    modalTranslateY.value = withTiming(0, { duration: 200 });
    setRewardActionError(null);
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

  const handleRedeem = async (rewardId: string, cost: number) => {
    setRewardActionError(null);
    if (needsCpf) {
      setShowCpfModal(true);
      return;
    }

    // Verificar se já foi resgatado
    if (redeemedRewards.has(rewardId)) {
      return;
    }

    // Regra: value negativo só pode quando houver saldo suficiente.
    const requiredBalance = getRequiredBalanceForRedeem(cost);
    if (requiredBalance > 0 && currentPoints < requiredBalance) {
      const message = 'Saldo insuficiente para resgatar esta recompensa.';
      setRewardActionError(message);
      showActionToast(message, 'warning');
      return;
    }

    // Regra de item inativo localmente.
    const reward = rewards.find(r => r.id === rewardId);
    if (reward?.disabled) {
      const message = 'Esta recompensa está inativa no momento.';
      setRewardActionError(message);
      showActionToast(message, 'warning');
      return;
    }

    setLoadingRedeemId(rewardId);
    try {
      const result = await redeemReward(rewardId);
      const newBalance =
        typeof result.rewardPoints === 'number' ? result.rewardPoints : currentPoints - cost;
      setCurrentPoints(newBalance);
      setRedeemedRewards((prev) => new Set(prev).add(rewardId));
      await loadRedemptions();
      showActionToast('Recompensa resgatada com sucesso!', 'success');
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

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ translateY: modalTranslateY.value }],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value * 0.4,
    };
  });

  useEffect(() => {
    void loadPoints();
  }, []);

  return (
    <>
      {/* Badge Button */}
      <TouchableOpacity
        onPress={openModal}
        activeOpacity={0.8}
        style={styles.badgeContainer}
      >
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

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <Animated.View
            style={[styles.backdrop, backdropAnimatedStyle]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeModal}
            />
          </Animated.View>

          {/* Modal Panel */}
          <Animated.View style={[styles.modalPanel, modalAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Loja de Recompensas</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={AppColors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Seu Saldo</Text>
                <View style={styles.balanceValue}>
                  <Ionicons
                    name="star-outline"
                    size={20}
                    color={AppColors.palette.purple.base}
                  />
                  <Text style={styles.balanceText}>
                    {currentPoints.toLocaleString('pt-BR')}
                  </Text>
                </View>
                {redemptions.length > 0 ? (
                  <Text style={styles.balanceStatusText}>
                    {redemptions.length} resgate{redemptions.length > 1 ? 's' : ''} no histórico
                  </Text>
                ) : null}
                {needsCpf ? (
                  <View style={styles.cpfWarningContainer}>
                    <Text style={styles.cpfWarningText}>
                      Cadastre seu CPF para resgatar recompensas.
                    </Text>
                    <TouchableOpacity
                      style={styles.cpfWarningButton}
                      onPress={() => router.push('/edit-account')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cpfWarningButtonText}>Completar cadastro</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {isLoadingPoints ? (
                  <Text style={styles.balanceStatusText}>Atualizando saldo...</Text>
                ) : null}
                {!isLoadingPoints && pointsError ? (
                  <View style={styles.pointsErrorContainer}>
                    <Text style={styles.balanceErrorText}>{pointsError}</Text>
                    <TouchableOpacity
                      style={styles.retryPointsButton}
                      onPress={() => {
                        void loadPoints();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.retryPointsButtonText}>Recarregar saldo</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Rewards List */}
            <View style={styles.rewardsListContainer}>
              <ScrollView
                style={styles.rewardsList}
                contentContainerStyle={styles.rewardsListContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {rewardActionError ? (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackTextError}>{rewardActionError}</Text>
                  </View>
                ) : null}
                {rewards.map((reward) => (
                  <View key={reward.id} style={styles.rewardCard}>
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardTitle}>{reward.name}</Text>
                      {reward.description ? (
                        <Text style={styles.rewardDescription}>{reward.description}</Text>
                      ) : null}
                      <View style={styles.rewardCost}>
                        <Ionicons
                          name="star-outline"
                          size={16}
                          color={AppColors.palette.purple.base}
                        />
                        <Text style={styles.rewardCostText}>
                          {reward.value.toLocaleString('pt-BR')}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.redeemButton,
                        (reward.disabled ||
                          redeemedRewards.has(reward.id) ||
                          loadingRedeemId === reward.id) &&
                          styles.redeemButtonDisabled,
                      ]}
                      onPress={() => {
                        void handleRedeem(reward.id, reward.value);
                      }}
                      disabled={reward.disabled || redeemedRewards.has(reward.id) || loadingRedeemId === reward.id}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.redeemButtonText,
                          (reward.disabled ||
                            redeemedRewards.has(reward.id) ||
                            loadingRedeemId === reward.id) &&
                            styles.redeemButtonTextDisabled,
                        ]}
                      >
                        {loadingRedeemId === reward.id
                          ? 'Resgatando...'
                          : redeemedRewards.has(reward.id)
                            ? 'Resgatado'
                            : 'Resgatar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {isLoadingRewards ? (
                  <View style={styles.feedbackContainer}>
                    <ActivityIndicator color={AppColors.palette.purple.base} />
                    <Text style={styles.feedbackText}>Carregando recompensas...</Text>
                  </View>
                ) : null}
                {!isLoadingRewards && rewardsError ? (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackTextError}>{rewardsError}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        void loadRewards();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.retryButtonText}>Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {!isLoadingRewards && !rewardsError && rewards.length === 0 ? (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackText}>Nenhuma recompensa disponível no momento.</Text>
                  </View>
                ) : null}

                {redemptions.length > 0 ? (
                  <View style={styles.historySection}>
                    <Text style={styles.historyTitle}>Histórico de resgates</Text>
                    {redemptions.slice(0, 8).map((item) => {
                      const rewardName =
                        item.reward?.name ??
                        rewards.find((r) => r.id === item.rewardId)?.name ??
                        'Recompensa';
                      return (
                        <View key={item.id} style={styles.historyItem}>
                          <Text style={styles.historyRewardName} numberOfLines={1}>
                            {rewardName}
                          </Text>
                          <Text style={styles.historyMeta}>
                            {formatRedemptionDate(item.createdAt)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </Animated.View>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
    flexShrink: 0,
  },
  rewardsListContainer: {
    flex: 1,
    minHeight: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 9999,
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.palette.purple.base,
  },
  cpfWarningContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  cpfWarningText: {
    fontSize: 12,
    color: AppColors.status.warning,
    textAlign: 'center',
  },
  cpfWarningButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: AppColors.status.warning,
  },
  cpfWarningButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.white,
  },
  balanceStatusText: {
    marginTop: 6,
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  pointsErrorContainer: {
    marginTop: 6,
    alignItems: 'center',
  },
  balanceErrorText: {
    fontSize: 12,
    color: AppColors.status.error,
    textAlign: 'center',
  },
  retryPointsButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: AppColors.palette.purple.base,
  },
  retryPointsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.white,
  },
  rewardsList: {
    flex: 1,
  },
  rewardsListContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  rewardCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardInfo: {
    flex: 1,
    marginRight: 12,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginBottom: 6,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardCostText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.palette.purple.base,
  },
  redeemButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: AppColors.palette.purple.base,
  },
  redeemButtonDisabled: {
    backgroundColor: AppColors.gray[200],
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text.white,
  },
  redeemButtonTextDisabled: {
    color: AppColors.text.tertiary,
  },
  feedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  feedbackText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
  feedbackTextError: {
    fontSize: 14,
    color: AppColors.status.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: AppColors.palette.purple.base,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.white,
  },
  historySection: {
    marginTop: 8,
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 8,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 2,
  },
  historyRewardName: {
    flex: 1,
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  historyMeta: {
    fontSize: 12,
    color: AppColors.text.tertiary,
    fontWeight: '500',
  },
});

