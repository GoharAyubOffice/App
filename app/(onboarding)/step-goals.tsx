import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useTheme, 
  useAppDispatch, 
  useOnboardingGoals, 
  useSelectedGoals 
} from '../../store/hooks';
import { 
  toggleGoal, 
  nextStep, 
  previousStep 
} from '../../store/slices/onboardingSlice';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';

const { width } = Dimensions.get('window');

export default function OnboardingGoalsScreen() {
  const { isDarkMode } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const goals = useOnboardingGoals();
  const selectedGoals = useSelectedGoals();

  const colors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    border: isDarkMode ? '#333333' : '#E1E5E9',
    selectedBorder: '#3B82F6',
    selectedBackground: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
  };

  const handleGoalToggle = (goalId: string) => {
    dispatch(toggleGoal(goalId));
  };

  const handleBack = () => {
    dispatch(previousStep());
    router.back();
  };

  const handleNext = () => {
    if (selectedGoals.length === 0) {
      return; // Require at least one goal
    }
    dispatch(nextStep());
    router.push('/(onboarding)/step-preferences');
  };

  const canProceed = selectedGoals.length > 0;

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

        <ProgressIndicator current={2} total={4} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            What are your main goals?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select all that apply. This helps us customize your experience.
          </Text>
        </View>

        <View style={styles.goalsGrid}>
          {goals.map((goal) => {
            const isSelected = goal.selected;
            
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: isSelected ? colors.selectedBackground : colors.surface,
                    borderColor: isSelected ? colors.selectedBorder : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                onPress={() => handleGoalToggle(goal.id)}
                testID={`goal-${goal.id}`}
              >
                <View style={styles.goalHeader}>
                  <View style={[
                    styles.goalIconContainer,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}>
                    <Ionicons 
                      name={goal.icon as any} 
                      size={24} 
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.checkboxContainer}>
                    {isSelected ? (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color={colors.primary}
                      />
                    ) : (
                      <View style={[
                        styles.checkbox,
                        { borderColor: colors.border }
                      ]} />
                    )}
                  </View>
                </View>

                <Text style={[styles.goalTitle, { color: colors.text }]}>
                  {goal.title}
                </Text>
                
                <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>
                  {goal.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.selectionInfo}>
          <Text style={[styles.selectionText, { color: colors.textSecondary }]}>
            {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
            {selectedGoals.length === 0 && ' • Select at least one to continue'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: canProceed ? colors.primary : colors.border,
              opacity: canProceed ? 1 : 0.6,
            }
          ]}
          onPress={handleNext}
          disabled={!canProceed}
          testID="next-button"
        >
          <Text style={[
            styles.nextButtonText,
            {
              color: canProceed ? '#FFFFFF' : colors.textSecondary,
            }
          ]}>
            Continue
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={canProceed ? '#FFFFFF' : colors.textSecondary}
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
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  goalCard: {
    width: (width - 48 - 12) / 2, // Account for padding and gap
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 140,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectionInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});