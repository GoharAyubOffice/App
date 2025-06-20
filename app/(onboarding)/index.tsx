import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useAppDispatch, useCurrentUser } from '../../store/hooks';
import { startOnboarding, nextStep } from '../../store/slices/onboardingSlice';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';

const { width, height } = Dimensions.get('window');

export default function OnboardingWelcomeScreen() {
  const { isDarkMode } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const colors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    border: isDarkMode ? '#333333' : '#E1E5E9',
  };

  useEffect(() => {
    // Initialize onboarding when component mounts
    dispatch(startOnboarding());
  }, [dispatch]);

  const handleGetStarted = () => {
    dispatch(nextStep());
    router.push('/(onboarding)/step-goals');
  };

  const handleSkip = () => {
    // For now, skip will complete onboarding with defaults
    router.replace('/(tabs)');
  };

  const userName = currentUser?.user_metadata?.full_name || 
                   currentUser?.email?.split('@')[0] || 
                   'there';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <ProgressIndicator current={1} total={4} />
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        testID="skip-button"
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Illustration/Icon */}
        <View style={[styles.illustrationContainer, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons 
              name="rocket" 
              size={80} 
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>

        {/* Welcome Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Welcome to FlowState, {userName}! 👋
          </Text>
          
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            Let's personalize your experience to help you achieve your goals and stay productive.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={colors.primary} 
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Organize tasks and projects
              </Text>
            </View>

            <View style={styles.feature}>
              <Ionicons 
                name="people" 
                size={24} 
                color={colors.primary} 
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Collaborate with your team
              </Text>
            </View>

            <View style={styles.feature}>
              <Ionicons 
                name="analytics" 
                size={24} 
                color={colors.primary} 
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Track your progress
              </Text>
            </View>
          </View>
        </View>

        {/* Setup Info */}
        <View style={[styles.setupInfo, { backgroundColor: colors.surface }]}>
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={colors.primary}
            style={styles.setupIcon}
          />
          <Text style={[styles.setupText, { color: colors.textSecondary }]}>
            Takes less than 2 minutes to complete
          </Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
          onPress={handleGetStarted}
          testID="get-started-button"
        >
          <Text style={styles.getStartedButtonText}>
            Get Started
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>

        <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
          Your preferences are stored securely and can be changed anytime
        </Text>
      </View>
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
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 40,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  welcomeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  setupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  setupIcon: {
    marginRight: 8,
  },
  setupText: {
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
    marginBottom: 16,
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
  privacyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});