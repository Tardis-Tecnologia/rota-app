import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  visible: boolean;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  type = 'success',
  duration = 1000,
  onHide,
}) => {
  const opacity = useSharedValue(visible ? 1 : 0);
  const translateY = useSharedValue(visible ? 0 : 50);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withTiming(0, { duration: 100 });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      translateY.value = withTiming(50, { duration: 100 });
    }
  }, [visible, opacity, translateY]);

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        if (onHide) {
          onHide();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconColor: AppColors.status.success,
          backgroundColor: '#ECFDF5',
          textColor: '#065F46',
        };
      case 'error':
        return {
          iconColor: AppColors.status.error,
          backgroundColor: '#FEF2F2',
          textColor: AppColors.text.primary,
        };
      case 'warning':
        return {
          iconColor: AppColors.status.warning,
          backgroundColor: '#FFFBEB',
          textColor: AppColors.text.primary,
        };
      case 'info':
        return {
          iconColor: AppColors.status.info,
          backgroundColor: '#EFF6FF',
          textColor: AppColors.text.primary,
        };
      default:
        return {
          iconColor: AppColors.status.success,
          backgroundColor: '#F0F9FF',
          textColor: AppColors.text.primary,
        };
    }
  };

  const typeStyles = getTypeStyles();

  const iconName: React.ComponentProps<typeof Ionicons>['name'] =
    type === 'success'
      ? 'checkmark-circle'
      : type === 'error'
        ? 'close-circle'
        : type === 'warning'
          ? 'warning'
          : 'information-circle';

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      {visible && (
        <View style={[styles.toast, { backgroundColor: typeStyles.backgroundColor }]}>
          <View style={[styles.iconContainer, { backgroundColor: typeStyles.iconColor }]}>
            <Ionicons name={iconName} size={16} color={AppColors.text.white} />
          </View>
          <Text style={[styles.message, { color: typeStyles.textColor }]}>{message}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: '90%',
    minWidth: 200,
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 20,
  },
});

export default Toast;

