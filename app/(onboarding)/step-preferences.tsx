import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useTheme, 
  useAppDispatch, 
  useOnboardingPreferences 
} from '../../store/hooks';
import { 
  setWorkStyle,
  setExperienceLevel,
  setPrimaryUseCase,
  setNotificationsEnabled,
  setReminderFrequency,
  setDefaultTaskPriority,
  setTheme,
  nextStep,
  previousStep 
} from '../../store/slices/onboardingSlice';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';

interface OptionCardProps {
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
  testID?: string;
}

const OptionCard: React.FC<OptionCardProps> = ({
  title,
  description,
  icon,
  isSelected,
  onPress,
  testID,
}) => {
  const { isDarkMode } = useTheme();
  
  const colors = {
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    border: isDarkMode ? '#333333' : '#E1E5E9',
    selectedBorder: '#3B82F6',
    selectedBackground: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    primary: '#3B82F6',
  };

  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: isSelected ? colors.selectedBackground : colors.surface,
          borderColor: isSelected ? colors.selectedBorder : colors.border,
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={onPress}
      testID={testID}
    >
      <View style={styles.optionHeader}>
        <View style={[
          styles.optionIcon,
          {
            backgroundColor: isSelected ? colors.primary : colors.border,
          }
        ]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={isSelected ? '#FFFFFF' : colors.textSecondary}
          />
        </View>
        
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={colors.primary}
          />
        )}
      </View>
      
      <Text style={[styles.optionTitle, { color: colors.text }]}>
        {title}
      </Text>
      
      <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};

export default function OnboardingPreferencesScreen() {
  const { isDarkMode } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const preferences = useOnboardingPreferences();

  const colors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    primary: '#3B82F6',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    border: isDarkMode ? '#333333' : '#E1E5E9',
  };

  const handleBack = () => {
    dispatch(previousStep());
    router.back();
  };

  const handleNext = () => {
    dispatch(nextStep());
    router.push('/(onboarding)/step-completion');
  };

  const workStyleOptions = [
    {
      id: 'individual' as const,
      title: 'Individual',
      description: 'I mostly work on my own',
      icon: 'person-outline',
    },
    {
      id: 'team' as const,
      title: 'Team',
      description: 'I collaborate with others',
      icon: 'people-outline',
    },
    {
      id: 'mixed' as const,
      title: 'Mixed',
      description: 'Both individual and team work',
      icon: 'git-network-outline',
    },
  ];

  const experienceLevelOptions = [
    {
      id: 'beginner' as const,
      title: 'Beginner',
      description: 'New to task management',
      icon: 'school-outline',
    },
    {
      id: 'intermediate' as const,
      title: 'Intermediate',
      description: 'Some experience with tools',
      icon: 'trending-up-outline',
    },
    {
      id: 'advanced' as const,
      title: 'Advanced',
      description: 'Experienced power user',
      icon: 'rocket-outline',
    },
  ];

  const useCaseOptions = [
    {
      id: 'personal' as const,
      title: 'Personal',
      description: 'Life management and hobbies',
      icon: 'home-outline',
    },
    {
      id: 'work' as const,
      title: 'Work',
      description: 'Professional projects',
      icon: 'briefcase-outline',
    },
    {
      id: 'education' as const,
      title: 'Education',
      description: 'Studies and learning',
      icon: 'library-outline',
    },
    {
      id: 'freelance' as const,
      title: 'Freelance',
      description: 'Client projects and gigs',
      icon: 'laptop-outline',
    },
  ];

  const priorityOptions = [
    {
      id: 'low' as const,
      title: 'Low',
      description: 'Relaxed approach',
      icon: 'remove-circle-outline',
    },
    {
      id: 'medium' as const,
      title: 'Medium',
      description: 'Balanced priority',
      icon: 'ellipse-outline',
    },
    {
      id: 'high' as const,
      title: 'High',
      description: 'Important by default',
      icon: 'add-circle-outline',
    },
  ];

  const reminderOptions = [
    {
      id: 'none' as const,
      title: 'None',
      description: 'No reminders',
      icon: 'notifications-off-outline',
    },
    {
      id: 'daily' as const,
      title: 'Daily',
      description: 'Daily check-ins',
      icon: 'today-outline',
    },
    {
      id: 'weekly' as const,
      title: 'Weekly',
      description: 'Weekly summaries',
      icon: 'calendar-outline',
    },
  ];

  const themeOptions = [
    {
      id: 'system' as const,
      title: 'System',
      description: 'Follow device setting',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'light' as const,
      title: 'Light',
      description: 'Always light theme',
      icon: 'sunny-outline',
    },
    {
      id: 'dark' as const,
      title: 'Dark',
      description: 'Always dark theme',
      icon: 'moon-outline',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          testID="back-button"
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>

        <ProgressIndicator current={3} total={4} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Customize your preferences
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            These settings help us tailor the experience to your needs
          </Text>
        </View>

        {/* Work Style */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Work Style
          </Text>
          <View style={styles.optionsRow}>
            {workStyleOptions.map((option) => (
              <OptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                icon={option.icon}
                isSelected={preferences.workStyle === option.id}
                onPress={() => dispatch(setWorkStyle(option.id))}
                testID={`work-style-${option.id}`}
              />
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Experience Level
          </Text>
          <View style={styles.optionsRow}>
            {experienceLevelOptions.map((option) => (
              <OptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                icon={option.icon}
                isSelected={preferences.experienceLevel === option.id}
                onPress={() => dispatch(setExperienceLevel(option.id))}
                testID={`experience-${option.id}`}
              />
            ))}
          </View>
        </View>

        {/* Primary Use Case */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Primary Use Case
          </Text>
          <View style={styles.optionsGrid}>
            {useCaseOptions.map((option) => (
              <OptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                icon={option.icon}
                isSelected={preferences.primaryUseCase === option.id}
                onPress={() => dispatch(setPrimaryUseCase(option.id))}
                testID={`use-case-${option.id}`}
              />
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.toggleSection}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Notifications
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                Get updates about your tasks and projects
              </Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(value) => dispatch(setNotificationsEnabled(value))}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              testID="notifications-toggle"
            />
          </View>

          {preferences.notificationsEnabled && (
            <View style={styles.reminderOptions}>
              <Text style={[styles.subSectionTitle, { color: colors.text }]}>
                Reminder Frequency
              </Text>
              <View style={styles.optionsRow}>
                {reminderOptions.map((option) => (
                  <OptionCard
                    key={option.id}
                    title={option.title}
                    description={option.description}
                    icon={option.icon}
                    isSelected={preferences.reminderFrequency === option.id}
                    onPress={() => dispatch(setReminderFrequency(option.id))}
                    testID={`reminder-${option.id}`}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Default Task Priority */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Default Task Priority
          </Text>
          <View style={styles.optionsRow}>
            {priorityOptions.map((option) => (
              <OptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                icon={option.icon}
                isSelected={preferences.defaultTaskPriority === option.id}
                onPress={() => dispatch(setDefaultTaskPriority(option.id))}
                testID={`priority-${option.id}`}
              />
            ))}
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            App Theme
          </Text>
          <View style={styles.optionsRow}>
            {themeOptions.map((option) => (
              <OptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                icon={option.icon}
                isSelected={preferences.theme === option.id}
                onPress={() => dispatch(setTheme(option.id))}
                testID={`theme-${option.id}`}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          testID="next-button"
        >
          <Text style={styles.nextButtonText}>
            Continue
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  reminderOptions: {
    marginTop: 16,
  },
  bottomContainer: {
    paddingBottom: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});