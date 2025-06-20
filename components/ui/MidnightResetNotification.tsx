import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useShowNewDayNotification, useAppDispatch } from '../../store/hooks';
import { setShowNewDayNotification } from '../../store/slices/userActivitySlice';

export const MidnightResetNotification: React.FC = () => {
  const { isDarkMode } = useTheme();
  const showNotification = useShowNewDayNotification();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // Auto-hide the notification
  const hideNotification = () => {
    dispatch(setShowNewDayNotification(false));
  };

  // Show animation
  const showAnimation = () => {
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });

    // Auto-hide after 4 seconds
    hideTimeoutRef.current = setTimeout(() => {
      runOnJS(hideNotification)();
    }, 4000);
  };

  // Hide animation
  const hideAnimation = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 });

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  // Handle notification state changes
  useEffect(() => {
    if (showNotification) {
      showAnimation();
    } else {
      hideAnimation();
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [showNotification]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      opacity.value,
      [0, 1],
      [0, 0.15]
    );

    return {
      shadowOpacity,
    };
  });

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
    {
      top: insets.top + 16,
    },
  ];

  const textStyle = [
    styles.text,
    isDarkMode && styles.darkText,
  ];

  if (!showNotification) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        containerStyle,
        animatedStyle,
        Platform.OS === 'ios' && shadowStyle,
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="sunny"
            size={20}
            color={isDarkMode ? '#FFD700' : '#FF6B35'}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
            Your new day has begun! 🌅
          </Text>
          <Text style={textStyle}>
            Ready to tackle today's goals?
          </Text>
        </View>
      </View>

      {/* Subtle progress indicator */}
      <Animated.View style={[styles.progressBar, isDarkMode && styles.darkProgressBar]}>
        <Animated.View 
          style={[
            styles.progressFill,
            useAnimatedStyle(() => ({
              width: withTiming('100%', { duration: 4000 }),
            })),
          ]} 
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  darkContainer: {
    backgroundColor: '#2A2A2A',
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  text: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  darkText: {
    color: '#CCCCCC',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  darkProgressBar: {
    backgroundColor: '#404040',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    width: '0%',
  },
});

export default MidnightResetNotification;