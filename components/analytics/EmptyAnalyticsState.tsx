import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';
import { AnalyticsSummary } from '../../services/analyticsEngine';

const { width } = Dimensions.get('window');

interface EmptyAnalyticsStateProps {
  summary?: AnalyticsSummary;
  onRetry?: () => void;
}

interface DataRequirement {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action?: () => void;
  actionLabel?: string;
  completed: boolean;
}

export const EmptyAnalyticsState: React.FC<EmptyAnalyticsStateProps> = ({
  summary,
  onRetry,
}) => {
  const { isDarkMode } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getDataRequirements = (): DataRequirement[] => {
    if (!summary) {
      return [
        {
          title: 'Complete some tasks',
          description: 'Create and complete at least 5 tasks to see completion analytics',
          icon: 'checkmark-circle-outline',
          action: () => router.push('/tasks/create'),
          actionLabel: 'Create Task',
          completed: false,
        },
        {
          title: 'Log your mood',
          description: 'Record your daily mood for at least 3 days to see mood trends',
          icon: 'happy-outline',
          action: () => router.push('/mood/log'),
          actionLabel: 'Log Mood',
          completed: false,
        },
        {
          title: 'Track your time',
          description: 'Use time tracking to get productivity insights',
          icon: 'time-outline',
          actionLabel: 'Learn More',
          completed: false,
        },
      ];
    }

    return [
      {
        title: 'Complete more tasks',
        description: `You have ${summary.completedTasks} completed tasks. Complete at least 5 tasks to unlock detailed analytics.`,
        icon: 'checkmark-circle-outline',
        action: () => router.push('/tasks/create'),
        actionLabel: 'Create Task',
        completed: summary.dataQuality.tasksDataSufficient,
      },
      {
        title: 'Log your mood regularly',
        description: 'Record your daily mood for at least 3 days to see mood-productivity correlations.',
        icon: 'happy-outline',
        action: () => router.push('/mood/log'),
        actionLabel: 'Log Mood',
        completed: summary.dataQuality.moodDataSufficient,
      },
      {
        title: 'Build consistent habits',
        description: 'Maintain daily activity for meaningful streak analytics.',
        icon: 'flame-outline',
        actionLabel: 'View Streaks',
        completed: summary.dataQuality.streakDataSufficient,
      },
      {
        title: 'Track your time',
        description: 'Use time tracking to get detailed productivity insights.',
        icon: 'time-outline',
        actionLabel: 'Learn More',
        completed: summary.dataQuality.timeDataSufficient,
      },
    ];
  };

  const getEmptyStateContent = () => {
    if (!summary) {
      return {
        title: 'No Data Available',
        subtitle: 'Start using the app to see your analytics',
        description: 'Your personal productivity insights will appear here once you begin completing tasks, logging moods, and building habits.',
      };
    }

    if (summary.hasMinimumData) {
      return {
        title: 'Limited Data Available',
        subtitle: 'Complete a few more activities to unlock full analytics',
        description: 'You\'re on the right track! Continue using the app consistently to see comprehensive insights and trends.',
      };
    }

    return {
      title: 'Getting Started',
      subtitle: 'Build your analytics foundation',
      description: 'Complete the activities below to unlock powerful insights about your productivity, mood, and habits.',
    };
  };

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
  ];

  const cardStyle = [
    styles.card,
    isDarkMode && styles.darkCard,
  ];

  const textStyle = [
    styles.text,
    isDarkMode && styles.darkText,
  ];

  const titleStyle = [
    styles.title,
    isDarkMode && styles.darkTitle,
  ];

  const subtitleStyle = [
    styles.subtitle,
    isDarkMode && styles.darkSubtitle,
  ];

  const content = getEmptyStateContent();
  const requirements = getDataRequirements();
  const completedCount = requirements.filter(req => req.completed).length;
  const progressPercentage = (completedCount / requirements.length) * 100;

  return (
    <Animated.View 
      style={[
        containerStyle, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {/* Main Empty State */}
      <View style={cardStyle}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, isDarkMode && styles.darkIconBackground]}>
            <Ionicons 
              name="analytics" 
              size={48} 
              color={isDarkMode ? '#4A9EFF' : '#007AFF'} 
            />
          </View>
        </View>

        <Text style={titleStyle}>{content.title}</Text>
        <Text style={subtitleStyle}>{content.subtitle}</Text>
        <Text style={[textStyle, styles.description]}>{content.description}</Text>

        {summary && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[textStyle, styles.progressTitle]}>Progress</Text>
              <Text style={[styles.progressPercentage, { color: isDarkMode ? '#4A9EFF' : '#007AFF' }]}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
            <View style={[styles.progressBar, isDarkMode && styles.darkProgressBar]}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: isDarkMode ? '#4A9EFF' : '#007AFF',
                  }
                ]} 
              />
            </View>
            <Text style={[subtitleStyle, styles.progressText]}>
              {completedCount} of {requirements.length} requirements completed
            </Text>
          </View>
        )}

        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, isDarkMode && styles.darkRetryButton]}
            onPress={onRetry}
          >
            <Ionicons name="refresh" size={20} color={isDarkMode ? '#4A9EFF' : '#007AFF'} />
            <Text style={[styles.retryButtonText, isDarkMode && styles.darkRetryButtonText]}>
              Refresh Analytics
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Requirements List */}
      <View style={cardStyle}>
        <Text style={[titleStyle, styles.requirementsTitle]}>
          Get Started with Analytics
        </Text>
        <Text style={[subtitleStyle, styles.requirementsSubtitle]}>
          Complete these activities to unlock comprehensive insights
        </Text>

        <View style={styles.requirementsList}>
          {requirements.map((requirement, index) => (
            <View 
              key={index} 
              style={[
                styles.requirementItem,
                isDarkMode && styles.darkRequirementItem,
                requirement.completed && styles.completedRequirement,
              ]}
            >
              <View style={styles.requirementHeader}>
                <View style={styles.requirementIcon}>
                  <Ionicons 
                    name={requirement.completed ? 'checkmark-circle' : requirement.icon}
                    size={24} 
                    color={
                      requirement.completed 
                        ? '#4CAF50' 
                        : isDarkMode ? '#4A9EFF' : '#007AFF'
                    } 
                  />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={[
                    styles.requirementTitle,
                    isDarkMode && styles.darkRequirementTitle,
                    requirement.completed && styles.completedRequirementTitle,
                  ]}>
                    {requirement.title}
                  </Text>
                  <Text style={[
                    styles.requirementDescription,
                    isDarkMode && styles.darkRequirementDescription,
                  ]}>
                    {requirement.description}
                  </Text>
                </View>
              </View>

              {requirement.action && requirement.actionLabel && !requirement.completed && (
                <TouchableOpacity
                  style={[styles.requirementAction, isDarkMode && styles.darkRequirementAction]}
                  onPress={requirement.action}
                >
                  <Text style={[styles.requirementActionText, isDarkMode && styles.darkRequirementActionText]}>
                    {requirement.actionLabel}
                  </Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={isDarkMode ? '#4A9EFF' : '#007AFF'} 
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  darkContainer: {
    // No additional styles needed
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#2A2A2A',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkIconBackground: {
    backgroundColor: '#1E3A5F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  darkSubtitle: {
    color: '#CCCCCC',
  },
  text: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  darkText: {
    color: '#FFFFFF',
  },
  description: {
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  darkProgressBar: {
    backgroundColor: '#444444',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  darkRetryButton: {
    borderColor: '#4A9EFF',
  },
  retryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  darkRetryButtonText: {
    color: '#4A9EFF',
  },
  requirementsTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  requirementsSubtitle: {
    marginBottom: 20,
  },
  requirementsList: {
    gap: 16,
  },
  requirementItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  darkRequirementItem: {
    backgroundColor: '#333333',
    borderColor: '#444444',
  },
  completedRequirement: {
    backgroundColor: '#E8F5E8',
    borderColor: '#81C784',
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requirementIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  darkRequirementTitle: {
    color: '#FFFFFF',
  },
  completedRequirementTitle: {
    color: '#2E7D32',
  },
  requirementDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  darkRequirementDescription: {
    color: '#CCCCCC',
  },
  requirementAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  darkRequirementAction: {
    borderColor: '#4A9EFF',
  },
  requirementActionText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  darkRequirementActionText: {
    color: '#4A9EFF',
  },
});

export default EmptyAnalyticsState;