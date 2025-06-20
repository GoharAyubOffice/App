import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
}

export interface OnboardingPreferences {
  workStyle: 'individual' | 'team' | 'mixed';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryUseCase: 'personal' | 'work' | 'education' | 'freelance';
  notificationsEnabled: boolean;
  reminderFrequency: 'none' | 'daily' | 'weekly';
  defaultTaskPriority: 'low' | 'medium' | 'high';
  theme: 'system' | 'light' | 'dark';
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  canResume: boolean;
  goals: OnboardingGoal[];
  preferences: OnboardingPreferences;
  startedAt: number | null;
  completedAt: number | null;
}

const defaultGoals: OnboardingGoal[] = [
  {
    id: 'productivity',
    title: 'Boost Productivity',
    description: 'Organize tasks and stay focused on what matters most',
    icon: 'rocket-outline',
    selected: false,
  },
  {
    id: 'collaboration',
    title: 'Team Collaboration',
    description: 'Work seamlessly with your team on shared projects',
    icon: 'people-outline',
    selected: false,
  },
  {
    id: 'time-management',
    title: 'Time Management',
    description: 'Track time and optimize your daily workflow',
    icon: 'time-outline',
    selected: false,
  },
  {
    id: 'goal-tracking',
    title: 'Goal Tracking',
    description: 'Set and achieve your personal and professional goals',
    icon: 'flag-outline',
    selected: false,
  },
  {
    id: 'habit-building',
    title: 'Build Habits',
    description: 'Create lasting habits and maintain consistency',
    icon: 'checkmark-circle-outline',
    selected: false,
  },
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'Manage complex projects from start to finish',
    icon: 'folder-outline',
    selected: false,
  },
];

const defaultPreferences: OnboardingPreferences = {
  workStyle: 'individual',
  experienceLevel: 'beginner',
  primaryUseCase: 'personal',
  notificationsEnabled: true,
  reminderFrequency: 'daily',
  defaultTaskPriority: 'medium',
  theme: 'system',
};

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 4,
  isCompleted: false,
  canResume: false,
  goals: defaultGoals,
  preferences: defaultPreferences,
  startedAt: null,
  completedAt: null,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    startOnboarding: (state) => {
      state.currentStep = 0;
      state.isCompleted = false;
      state.canResume = true;
      state.startedAt = Date.now();
      state.completedAt = null;
    },

    nextStep: (state) => {
      if (state.currentStep < state.totalSteps - 1) {
        state.currentStep += 1;
      }
    },

    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },

    goToStep: (state, action: PayloadAction<number>) => {
      const step = action.payload;
      if (step >= 0 && step < state.totalSteps) {
        state.currentStep = step;
      }
    },

    toggleGoal: (state, action: PayloadAction<string>) => {
      const goalId = action.payload;
      const goal = state.goals.find(g => g.id === goalId);
      if (goal) {
        goal.selected = !goal.selected;
      }
    },

    selectGoals: (state, action: PayloadAction<string[]>) => {
      const selectedIds = action.payload;
      state.goals.forEach(goal => {
        goal.selected = selectedIds.includes(goal.id);
      });
    },

    updatePreferences: (state, action: PayloadAction<Partial<OnboardingPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    setWorkStyle: (state, action: PayloadAction<OnboardingPreferences['workStyle']>) => {
      state.preferences.workStyle = action.payload;
    },

    setExperienceLevel: (state, action: PayloadAction<OnboardingPreferences['experienceLevel']>) => {
      state.preferences.experienceLevel = action.payload;
    },

    setPrimaryUseCase: (state, action: PayloadAction<OnboardingPreferences['primaryUseCase']>) => {
      state.preferences.primaryUseCase = action.payload;
    },

    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.preferences.notificationsEnabled = action.payload;
    },

    setReminderFrequency: (state, action: PayloadAction<OnboardingPreferences['reminderFrequency']>) => {
      state.preferences.reminderFrequency = action.payload;
    },

    setDefaultTaskPriority: (state, action: PayloadAction<OnboardingPreferences['defaultTaskPriority']>) => {
      state.preferences.defaultTaskPriority = action.payload;
    },

    setTheme: (state, action: PayloadAction<OnboardingPreferences['theme']>) => {
      state.preferences.theme = action.payload;
    },

    completeOnboarding: (state) => {
      state.isCompleted = true;
      state.canResume = false;
      state.completedAt = Date.now();
      state.currentStep = state.totalSteps - 1;
    },

    resetOnboarding: (state) => {
      return { ...initialState, goals: defaultGoals, preferences: defaultPreferences };
    },

    skipOnboarding: (state) => {
      state.isCompleted = true;
      state.canResume = false;
      state.completedAt = Date.now();
    },

    saveProgress: (state) => {
      // This action can be used to trigger persistence
      // The actual persistence is handled by redux-persist
    },
  },
});

export const {
  startOnboarding,
  nextStep,
  previousStep,
  goToStep,
  toggleGoal,
  selectGoals,
  updatePreferences,
  setWorkStyle,
  setExperienceLevel,
  setPrimaryUseCase,
  setNotificationsEnabled,
  setReminderFrequency,
  setDefaultTaskPriority,
  setTheme,
  completeOnboarding,
  resetOnboarding,
  skipOnboarding,
  saveProgress,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;

// Selectors
export const selectOnboardingState = (state: { onboarding: OnboardingState }) => state.onboarding;
export const selectCurrentStep = (state: { onboarding: OnboardingState }) => state.onboarding.currentStep;
export const selectTotalSteps = (state: { onboarding: OnboardingState }) => state.onboarding.totalSteps;
export const selectIsOnboardingCompleted = (state: { onboarding: OnboardingState }) => state.onboarding.isCompleted;
export const selectCanResumeOnboarding = (state: { onboarding: OnboardingState }) => state.onboarding.canResume;
export const selectOnboardingGoals = (state: { onboarding: OnboardingState }) => state.onboarding.goals;
export const selectSelectedGoals = (state: { onboarding: OnboardingState }) => 
  state.onboarding.goals.filter(goal => goal.selected);
export const selectOnboardingPreferences = (state: { onboarding: OnboardingState }) => state.onboarding.preferences;
export const selectOnboardingProgress = (state: { onboarding: OnboardingState }) => ({
  current: state.onboarding.currentStep + 1,
  total: state.onboarding.totalSteps,
  percentage: ((state.onboarding.currentStep + 1) / state.onboarding.totalSteps) * 100,
});