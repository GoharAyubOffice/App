import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface UseAnimatedCompletionProps {
  isCompleted: boolean;
  onAnimationComplete?: () => void;
  animationDuration?: number;
}

export const useAnimatedCompletion = ({
  isCompleted,
  onAnimationComplete,
  animationDuration = 300,
}: UseAnimatedCompletionProps) => {
  // Animation values
  const opacity = useSharedValue(isCompleted ? 0.6 : 1);
  const scale = useSharedValue(1);
  const checkboxScale = useSharedValue(isCompleted ? 1.2 : 1);
  const strikethroughWidth = useSharedValue(isCompleted ? 100 : 0);

  // Trigger animations when completion state changes
  useEffect(() => {
    if (isCompleted) {
      // Completing animation sequence
      // 1. Scale up checkbox with haptic feedback
      checkboxScale.value = withSpring(1.2, {
        damping: 10,
        stiffness: 100,
      });

      // 2. Scale up the entire item briefly
      scale.value = withSequence(
        withTiming(1.02, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      // 3. Fade out the content and animate strikethrough
      opacity.value = withTiming(0.6, { duration: animationDuration });
      strikethroughWidth.value = withTiming(100, {
        duration: animationDuration + 100,
      }, () => {
        if (onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });

      // Provide haptic feedback
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Uncompleting animation sequence
      // 1. Reset checkbox scale
      checkboxScale.value = withSpring(1, {
        damping: 10,
        stiffness: 100,
      });

      // 2. Restore opacity and remove strikethrough
      opacity.value = withTiming(1, { duration: animationDuration });
      strikethroughWidth.value = withTiming(0, {
        duration: animationDuration,
      }, () => {
        if (onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });

      // Light haptic feedback for uncompleting
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isCompleted, animationDuration, onAnimationComplete]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const strikethroughAnimatedStyle = useAnimatedStyle(() => ({
    width: `${strikethroughWidth.value}%`,
  }));

  // Animation trigger functions
  const triggerCompletionAnimation = () => {
    // Scale animation for immediate feedback
    scale.value = withSequence(
      withTiming(0.98, { duration: 50 }),
      withTiming(1, { duration: 150 })
    );

    // Haptic feedback for the tap
    runOnJS(Haptics.selectionAsync)();
  };

  const triggerSuccessAnimation = () => {
    // Success bounce animation
    checkboxScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1.2, {
        damping: 8,
        stiffness: 120,
      })
    );

    // Success haptic feedback
    runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
  };

  const triggerErrorAnimation = () => {
    // Error shake animation
    scale.value = withSequence(
      withTiming(1.02, { duration: 50 }),
      withTiming(0.98, { duration: 50 }),
      withTiming(1.02, { duration: 50 }),
      withTiming(1, { duration: 50 })
    );

    // Error haptic feedback
    runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
  };

  return {
    // Animated styles
    containerAnimatedStyle,
    checkboxAnimatedStyle,
    textAnimatedStyle,
    strikethroughAnimatedStyle,
    
    // Animation triggers
    triggerCompletionAnimation,
    triggerSuccessAnimation,
    triggerErrorAnimation,
    
    // Animation values (if needed for custom animations)
    animationValues: {
      opacity,
      scale,
      checkboxScale,
      strikethroughWidth,
    },
  };
};