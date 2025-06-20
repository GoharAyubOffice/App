import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../store/hooks';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onHide?: () => void;
  visible: boolean;
}

const { width } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onHide,
  visible,
}) => {
  const { isDarkMode } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          background: isDarkMode ? '#065F46' : '#D1FAE5',
          border: isDarkMode ? '#10B981' : '#059669',
          text: isDarkMode ? '#A7F3D0' : '#065F46',
          icon: isDarkMode ? '#A7F3D0' : '#059669',
        };
      case 'error':
        return {
          background: isDarkMode ? '#7F1D1D' : '#FEE2E2',
          border: isDarkMode ? '#DC2626' : '#F87171',
          text: isDarkMode ? '#FCA5A5' : '#B91C1C',
          icon: isDarkMode ? '#FCA5A5' : '#B91C1C',
        };
      case 'warning':
        return {
          background: isDarkMode ? '#78350F' : '#FEF3C7',
          border: isDarkMode ? '#D97706' : '#F59E0B',
          text: isDarkMode ? '#FCD34D' : '#92400E',
          icon: isDarkMode ? '#FCD34D' : '#92400E',
        };
      case 'info':
      default:
        return {
          background: isDarkMode ? '#1E3A8A' : '#DBEAFE',
          border: isDarkMode ? '#3B82F6' : '#60A5FA',
          text: isDarkMode ? '#93C5FD' : '#1D4ED8',
          icon: isDarkMode ? '#93C5FD' : '#1D4ED8',
        };
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const colors = getColors();

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      const timer = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished && onHide) {
            runOnJS(onHide)();
          }
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        animatedStyle,
      ]}
    >
      <Ionicons
        name={getIconName()}
        size={20}
        color={colors.icon}
        style={styles.icon}
      />
      <Text 
        style={[styles.message, { color: colors.text }]}
        numberOfLines={2}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});