import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useMemo } from 'react';
import type { AppDispatch, RootState } from './index';
import {
  selectOnboardingState,
  selectCurrentStep,
  selectTotalSteps,
  selectIsOnboardingCompleted,
  selectCanResumeOnboarding,
  selectOnboardingGoals,
  selectSelectedGoals,
  selectOnboardingPreferences,
  selectOnboardingProgress,
} from './slices/onboardingSlice';
import {
  selectUserActivity,
  selectTodaysActivity,
  selectStreaks,
  selectDailyStreak,
  selectLongestStreak,
  selectWeeklyProgress,
  selectMonthlyProgress,
  selectActivityLoading,
  selectActivityError,
  selectShowNewDayNotification,
  selectMidnightResetInProgress,
} from './slices/userActivitySlice';

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom hooks for common state selections
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

export const useCurrentUser = () => {
  return useAppSelector((state) => state.auth.user);
};

export const useIsAuthenticated = () => {
  return useAppSelector((state) => state.auth.isAuthenticated);
};

export const useAuthLoading = () => {
  return useAppSelector((state) => state.auth.isLoading);
};

export const useAuthError = () => {
  return useAppSelector((state) => state.auth.error);
};

// UI State hooks
export const useUI = () => {
  return useAppSelector((state) => state.ui);
};

export const useActiveTab = () => {
  return useAppSelector((state) => state.ui.activeTab);
};

export const useTheme = () => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const fontSize = useAppSelector((state) => state.ui.fontSize);
  
  return useMemo(() => ({
    isDarkMode,
    fontSize,
    theme: isDarkMode ? 'dark' : 'light',
  }), [isDarkMode, fontSize]);
};

export const useNetworkState = () => {
  const isOffline = useAppSelector((state) => state.ui.isOffline);
  const hasNetworkConnection = useAppSelector((state) => state.ui.hasNetworkConnection);
  
  return useMemo(() => ({
    isOffline,
    hasNetworkConnection,
    isOnline: !isOffline && hasNetworkConnection,
  }), [isOffline, hasNetworkConnection]);
};

export const useTaskSelection = () => {
  const selectedTasks = useAppSelector((state) => state.ui.selectedTasks);
  const isMultiSelectMode = useAppSelector((state) => state.ui.isMultiSelectMode);
  
  return useMemo(() => ({
    selectedTasks,
    isMultiSelectMode,
    hasSelection: selectedTasks.length > 0,
    selectionCount: selectedTasks.length,
  }), [selectedTasks, isMultiSelectMode]);
};

export const useTaskFilters = () => {
  const taskFilters = useAppSelector((state) => state.ui.taskFilters);
  const taskSortBy = useAppSelector((state) => state.ui.taskSortBy);
  const taskSortOrder = useAppSelector((state) => state.ui.taskSortOrder);
  
  return useMemo(() => {
    const hasActiveFilters = Object.values(taskFilters).some(filter => filter.length > 0);
    
    return {
      filters: taskFilters,
      sortBy: taskSortBy,
      sortOrder: taskSortOrder,
      hasActiveFilters,
    };
  }, [taskFilters, taskSortBy, taskSortOrder]);
};

export const useOnboardingState = () => {
  const hasCompletedOnboarding = useAppSelector((state) => state.ui.hasCompletedOnboarding);
  const hasSeenTutorial = useAppSelector((state) => state.ui.hasSeenTutorial);
  const isOnboarded = useAppSelector((state) => state.auth.isOnboarded);
  
  return useMemo(() => ({
    hasCompletedOnboarding,
    hasSeenTutorial,
    isOnboarded,
    needsOnboarding: !hasCompletedOnboarding && !isOnboarded,
  }), [hasCompletedOnboarding, hasSeenTutorial, isOnboarded]);
};

export const useLastActiveItems = () => {
  const lastActiveWorkspace = useAppSelector((state) => state.ui.lastActiveWorkspace);
  const lastActiveProject = useAppSelector((state) => state.ui.lastActiveProject);
  
  return useMemo(() => ({
    workspace: lastActiveWorkspace,
    project: lastActiveProject,
    hasLastActive: !!(lastActiveWorkspace || lastActiveProject),
  }), [lastActiveWorkspace, lastActiveProject]);
};

export const useSyncState = () => {
  const lastSyncTime = useAppSelector((state) => state.ui.lastSyncTime);
  const pendingSyncCount = useAppSelector((state) => state.ui.pendingSyncCount);
  
  return useMemo(() => {
    const lastSyncDate = lastSyncTime ? new Date(lastSyncTime) : null;
    const hasPendingSync = pendingSyncCount > 0;
    
    return {
      lastSyncTime: lastSyncDate,
      pendingSyncCount,
      hasPendingSync,
      isUpToDate: !hasPendingSync,
    };
  }, [lastSyncTime, pendingSyncCount]);
};

// Utility hook for checking if a specific tutorial has been seen
export const useHasSeenTutorial = (tutorialKey: string) => {
  return useAppSelector((state) => state.ui.hasSeenTutorial[tutorialKey] || false);
};

// Utility hook for checking if a task is selected
export const useIsTaskSelected = (taskId: string) => {
  return useAppSelector((state) => state.ui.selectedTasks.includes(taskId));
};

// Hook for modal state management
export const useModal = () => {
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  
  return useMemo(() => ({
    activeModal,
    isModalOpen: !!activeModal,
  }), [activeModal]);
};

// Hook for sidebar state
export const useSidebar = () => {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  
  return useMemo(() => ({
    isOpen: sidebarOpen,
    isClosed: !sidebarOpen,
  }), [sidebarOpen]);
};

// Onboarding hooks
export const useOnboarding = () => {
  return useAppSelector(selectOnboardingState);
};

export const useOnboardingStep = () => {
  return useAppSelector(selectCurrentStep);
};

export const useOnboardingProgress = () => {
  return useAppSelector(selectOnboardingProgress);
};

export const useIsOnboardingCompleted = () => {
  return useAppSelector(selectIsOnboardingCompleted);
};

export const useCanResumeOnboarding = () => {
  return useAppSelector(selectCanResumeOnboarding);
};

export const useOnboardingGoals = () => {
  return useAppSelector(selectOnboardingGoals);
};

export const useSelectedGoals = () => {
  return useAppSelector(selectSelectedGoals);
};

export const useOnboardingPreferences = () => {
  return useAppSelector(selectOnboardingPreferences);
};

// User Activity hooks
export const useUserActivity = () => {
  return useAppSelector(selectUserActivity);
};

export const useTodaysActivity = () => {
  return useAppSelector(selectTodaysActivity);
};

export const useStreaks = () => {
  return useAppSelector(selectStreaks);
};

export const useDailyStreak = () => {
  return useAppSelector(selectDailyStreak);
};

export const useLongestStreak = () => {
  return useAppSelector(selectLongestStreak);
};

export const useWeeklyProgress = () => {
  return useAppSelector(selectWeeklyProgress);
};

export const useMonthlyProgress = () => {
  return useAppSelector(selectMonthlyProgress);
};

export const useActivityLoading = () => {
  return useAppSelector(selectActivityLoading);
};

export const useActivityError = () => {
  return useAppSelector(selectActivityError);
};

export const useShowNewDayNotification = () => {
  return useAppSelector(selectShowNewDayNotification);
};

export const useMidnightResetInProgress = () => {
  return useAppSelector(selectMidnightResetInProgress);
};

// Combined hook for common app state
export const useAppState = () => {
  const auth = useAuth();
  const networkState = useNetworkState();
  const syncState = useSyncState();
  const isOnboardingCompleted = useIsOnboardingCompleted();
  
  return useMemo(() => ({
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isOnline: networkState.isOnline,
    isOffline: networkState.isOffline,
    hasPendingSync: syncState.hasPendingSync,
    isReady: auth.isAuthenticated && !auth.isLoading,
    needsOnboarding: auth.isAuthenticated && !isOnboardingCompleted,
  }), [auth, networkState, syncState, isOnboardingCompleted]);
};