import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { 
  useTheme, 
  useAppDispatch, 
  useCurrentUser,
  useSelectedGoals,
  useOnboardingPreferences 
} from '../../store/hooks';
import { completeOnboarding } from '../../store/slices/onboardingSlice';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';
import { Spinner } from '../../components/ui/Spinner';
import { UserProfileActions } from '../../db/actions/userProfileActions';

const { width } = Dimensions.get('window');

export default function OnboardingCompletionScreen() {
  const { isDarkMode } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const selectedGoals = useSelectedGoals();
  const preferences = useOnboardingPreferences();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkmarkScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const colors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    primary: '#3B82F6',
    success: '#10B981',
    error: '#EF4444',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
  };

  const userName = currentUser?.user_metadata?.full_name || 
                   currentUser?.email?.split('@')[0] || 
                   'there';

  useEffect(() => {
    // Start processing immediately when component mounts
    handleCompleteOnboarding();
  }, []);

  const animateSuccess = () => {
    checkmarkScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    checkmarkOpacity.value = withSpring(1);
    contentOpacity.value = withDelay(300, withSpring(1));
  };

  const handleCompleteOnboarding = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Update user profile with onboarding data
      const profileId = currentUser.id;
      await UserProfileActions.updateOnboardingData(
        profileId,
        preferences,
        selectedGoals
      );

      // Create default workspace for the user
      await UserProfileActions.createDefaultWorkspace(
        profileId,
        userName
      );

      // Mark onboarding as completed in Redux
      dispatch(completeOnboarding());

      // Animate success
      runOnJS(animateSuccess)();
      setIsCompleted(true);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    setError(null);
    handleCompleteOnboarding();
  };

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (isProcessing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.processingContainer}>
          <Spinner size="large" color={colors.primary} />
          <Text style={[styles.processingText, { color: colors.text }]}>
            Setting up your workspace...
          </Text>
          <Text style={[styles.processingSubtext, { color: colors.textSecondary }]}>
            This will only take a moment
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: colors.error }]}>
            <Ionicons name="alert-circle" size={48} color="#FFFFFF" />
          </View>
          
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Something went wrong
          </Text>
          
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error}
          </Text>

          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRetry}
            testID="retry-button"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <ProgressIndicator current={4} total={4} />
      </View>

      {/* Success Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.successIconContainer, checkmarkAnimatedStyle]}>
          <LinearGradient
            colors={[colors.success, '#059669']}
            style={styles.successIcon}
          >
            <Ionicons 
              name="checkmark" 
              size={60} 
              color="#FFFFFF"
            />
          </LinearGradient>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={[styles.messageContainer, contentAnimatedStyle]}>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            You're all set, {userName}! 🎉
          </Text>
          
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Your workspace has been created and customized based on your preferences.
          </Text>

          {/* Summary */}
          <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Your Setup Summary
            </Text>
            
            <View style={styles.summaryItem}>
              <Ionicons 
                name="flag-outline" 
                size={16} 
                color={colors.primary}
                style={styles.summaryIcon}
              />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons 
                name="person-outline" 
                size={16} 
                color={colors.primary}
                style={styles.summaryIcon}
              />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {preferences.workStyle} work style
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons 
                name="briefcase-outline" 
                size={16} 
                color={colors.primary}
                style={styles.summaryIcon}
              />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {preferences.primaryUseCase} use case
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons 
                name="folder-outline" 
                size={16} 
                color={colors.primary}
                style={styles.summaryIcon}
              />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                Default workspace created
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              What's next?
            </Text>
            
            <View style={styles.feature}>
              <Ionicons 
                name="add-circle-outline" 
                size={20} 
                color={colors.primary}
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Create your first task or project
              </Text>
            </View>

            <View style={styles.feature}>
              <Ionicons 
                name="people-outline" 
                size={20} 
                color={colors.primary}
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Invite team members to collaborate
              </Text>
            </View>

            <View style={styles.feature}>
              <Ionicons 
                name="settings-outline" 
                size={20} 
                color={colors.primary}
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Customize settings anytime in preferences
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Actions */}
      <Animated.View style={[styles.bottomContainer, contentAnimatedStyle]}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
          onPress={handleGetStarted}
          testID="get-started-button"
        >
          <Text style={styles.getStartedButtonText}>
            Start Using FlowState
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  progressContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    width: '100%',
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomContainer: {
    paddingBottom: 20,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});