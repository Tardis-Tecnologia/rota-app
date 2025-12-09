import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
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
  title: string;
  cost: number;
  disabled?: boolean;
}

interface PointsBadgeProps {
  points?: number;
  rewards?: Reward[];
  onRedeem?: (rewardId: string, cost: number, newBalance: number) => void;
}

const defaultRewards: Reward[] = [
  {
    id: '1',
    title: 'Voucher R$5 Estacionamento Rotativo',
    cost: 250,
  },
  {
    id: '2',
    title: 'Desconto R$10 no IPTU 2026',
    cost: 1000,
  },
  {
    id: '3',
    title: '1 Ingresso para o Cinema Municipal',
    cost: 750,
  },
  {
    id: '4',
    title: 'Crédito de R$20 no Transporte Público',
    cost: 1500,
    disabled: true,
  },
];

export default function PointsBadge({
  points: initialPoints = 1250,
  rewards = defaultRewards,
  onRedeem,
}: PointsBadgeProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(initialPoints);
  const [redeemedRewards, setRedeemedRewards] = useState<Set<string>>(new Set());
  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(300);

  const openModal = () => {
    setIsModalVisible(true);
    modalOpacity.value = withTiming(1, { duration: 200 });
    modalTranslateY.value = withTiming(0, { duration: 200 });
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalTranslateY.value = withTiming(300, { duration: 200 });
    setTimeout(() => {
      setIsModalVisible(false);
    }, 200);
  };

  const handleRedeem = (rewardId: string, cost: number) => {
    // Verificar se já foi resgatado
    if (redeemedRewards.has(rewardId)) {
      return;
    }

    // Verificar se tem pontos suficientes e não está desabilitado
    const reward = rewards.find(r => r.id === rewardId);
    if (currentPoints >= cost && !reward?.disabled) {
      // Descontar pontos
      const newBalance = currentPoints - cost;
      setCurrentPoints(newBalance);
      
      // Marcar como resgatado
      setRedeemedRewards((prev) => new Set(prev).add(rewardId));
      
      // Chamar callback se fornecido
      if (onRedeem) {
        onRedeem(rewardId, cost, newBalance);
      }
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
          <Ionicons name="star-outline" size={12} color={AppColors.text.white} />
          <Text style={styles.badgeText}>{currentPoints.toLocaleString('pt-BR')}</Text>
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
                {rewards.map((reward) => (
                  <View key={reward.id} style={styles.rewardCard}>
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardTitle}>{reward.title}</Text>
                      <View style={styles.rewardCost}>
                        <Ionicons
                          name="star-outline"
                          size={16}
                          color={AppColors.palette.purple.base}
                        />
                        <Text style={styles.rewardCostText}>
                          {reward.cost.toLocaleString('pt-BR')}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.redeemButton,
                        (reward.disabled || currentPoints < reward.cost || redeemedRewards.has(reward.id)) && styles.redeemButtonDisabled,
                      ]}
                      onPress={() => handleRedeem(reward.id, reward.cost)}
                      disabled={reward.disabled || currentPoints < reward.cost || redeemedRewards.has(reward.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.redeemButtonText,
                          (reward.disabled || currentPoints < reward.cost || redeemedRewards.has(reward.id)) && styles.redeemButtonTextDisabled,
                        ]}
                      >
                        {redeemedRewards.has(reward.id) ? 'Resgatado' : 'Resgatar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
});

