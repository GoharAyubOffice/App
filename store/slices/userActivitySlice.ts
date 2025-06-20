import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { streakActions } from '../../db/actions/streakActions';
import { UserStreak, DailyActivity } from '../../db';

export interface UserActivityState {
  // Current day data
  todaysActivity: DailyActivity | null;
  
  // Streak data
  streaks: UserStreak[];
  dailyStreak: number;
  longestStreak: number;
  
  // Statistics
  totalCompletions: number;
  averageCompletionRate: number;
  weeklyProgress: DailyActivity[];
  monthlyProgress: DailyActivity[];
  
  // UI state
  isLoading: boolean;
  lastUpdated: string | null;
  error: string | null;
  
  // Reset handling
  midnightResetInProgress: boolean;
  lastResetDate: string | null;
  showNewDayNotification: boolean;
}

const initialState: UserActivityState = {
  todaysActivity: null,
  streaks: [],
  dailyStreak: 0,
  longestStreak: 0,
  totalCompletions: 0,
  averageCompletionRate: 0,
  weeklyProgress: [],
  monthlyProgress: [],
  isLoading: false,
  lastUpdated: null,
  error: null,
  midnightResetInProgress: false,
  lastResetDate: null,
  showNewDayNotification: false,
};

// Async thunks
export const updateDailyActivity = createAsyncThunk(
  'userActivity/updateDailyActivity',
  async ({ userId, date }: { userId: string; date?: Date }) => {
    const result = await streakActions.updateDailyActivity(userId, date);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update daily activity');
    }
    return result;
  }
);

export const loadUserStreaks = createAsyncThunk(
  'userActivity/loadUserStreaks',
  async (userId: string) => {
    return await streakActions.getUserStreaks(userId);
  }
);

export const loadStreakStats = createAsyncThunk(
  'userActivity/loadStreakStats',
  async (userId: string) => {
    return await streakActions.getStreakStats(userId);
  }
);

export const loadWeeklyProgress = createAsyncThunk(
  'userActivity/loadWeeklyProgress',
  async (userId: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    return await streakActions.getDailyActivities(userId, startDate, endDate);
  }
);

export const loadMonthlyProgress = createAsyncThunk(
  'userActivity/loadMonthlyProgress',
  async (userId: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return await streakActions.getDailyActivities(userId, startDate, endDate);
  }
);

export const performMidnightReset = createAsyncThunk(
  'userActivity/performMidnightReset',
  async (userId: string) => {
    const result = await streakActions.performMidnightReset(userId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to perform midnight reset');
    }
    return result;
  }
);

// Slice
const userActivitySlice = createSlice({
  name: 'userActivity',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    setShowNewDayNotification: (state, action: PayloadAction<boolean>) => {
      state.showNewDayNotification = action.payload;
    },
    
    updateLastResetDate: (state, action: PayloadAction<string>) => {
      state.lastResetDate = action.payload;
    },
    
    incrementTaskCompletion: (state) => {
      // Optimistic update for immediate UI feedback
      if (state.todaysActivity) {
        state.todaysActivity.tasksCompleted += 1;
        if (state.todaysActivity.totalTasks > 0) {
          state.todaysActivity.completionRate = 
            (state.todaysActivity.tasksCompleted / state.todaysActivity.totalTasks) * 100;
        }
      }
    },
    
    decrementTaskCompletion: (state) => {
      // Optimistic update for task uncomplete
      if (state.todaysActivity && state.todaysActivity.tasksCompleted > 0) {
        state.todaysActivity.tasksCompleted -= 1;
        if (state.todaysActivity.totalTasks > 0) {
          state.todaysActivity.completionRate = 
            (state.todaysActivity.tasksCompleted / state.todaysActivity.totalTasks) * 100;
        }
      }
    },
    
    resetState: () => initialState,
  },
  
  extraReducers: (builder) => {
    // Update daily activity
    builder
      .addCase(updateDailyActivity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDailyActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todaysActivity = action.payload.dailyActivity || null;
        state.streaks = action.payload.streaks || [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateDailyActivity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update daily activity';
      });
    
    // Load user streaks
    builder
      .addCase(loadUserStreaks.fulfilled, (state, action) => {
        state.streaks = action.payload;
        const dailyStreak = action.payload.find(s => s.streakType === 'daily_completion');
        state.dailyStreak = dailyStreak?.currentCount || 0;
        state.longestStreak = dailyStreak?.longestCount || 0;
      });
    
    // Load streak stats
    builder
      .addCase(loadStreakStats.fulfilled, (state, action) => {
        state.dailyStreak = action.payload.dailyStreak;
        state.longestStreak = action.payload.longestStreak;
        state.totalCompletions = action.payload.totalCompletions;
        state.averageCompletionRate = action.payload.averageCompletionRate;
      });
    
    // Load weekly progress
    builder
      .addCase(loadWeeklyProgress.fulfilled, (state, action) => {
        state.weeklyProgress = action.payload;
      });
    
    // Load monthly progress
    builder
      .addCase(loadMonthlyProgress.fulfilled, (state, action) => {
        state.monthlyProgress = action.payload;
      });
    
    // Midnight reset
    builder
      .addCase(performMidnightReset.pending, (state) => {
        state.midnightResetInProgress = true;
        state.error = null;
      })
      .addCase(performMidnightReset.fulfilled, (state, action) => {
        state.midnightResetInProgress = false;
        state.streaks = action.payload.streaks || [];
        state.lastResetDate = new Date().toISOString();
        state.showNewDayNotification = true;
        
        // Reset today's activity
        state.todaysActivity = null;
        
        // Update streak counts
        const dailyStreak = state.streaks.find(s => s.streakType === 'daily_completion');
        state.dailyStreak = dailyStreak?.currentCount || 0;
      })
      .addCase(performMidnightReset.rejected, (state, action) => {
        state.midnightResetInProgress = false;
        state.error = action.error.message || 'Failed to perform midnight reset';
      });
  },
});

// Actions
export const {
  clearError,
  setShowNewDayNotification,
  updateLastResetDate,
  incrementTaskCompletion,
  decrementTaskCompletion,
  resetState,
} = userActivitySlice.actions;

// Selectors
export const selectUserActivity = (state: { userActivity: UserActivityState }) => state.userActivity;
export const selectTodaysActivity = (state: { userActivity: UserActivityState }) => state.userActivity.todaysActivity;
export const selectStreaks = (state: { userActivity: UserActivityState }) => state.userActivity.streaks;
export const selectDailyStreak = (state: { userActivity: UserActivityState }) => state.userActivity.dailyStreak;
export const selectLongestStreak = (state: { userActivity: UserActivityState }) => state.userActivity.longestStreak;
export const selectWeeklyProgress = (state: { userActivity: UserActivityState }) => state.userActivity.weeklyProgress;
export const selectMonthlyProgress = (state: { userActivity: UserActivityState }) => state.userActivity.monthlyProgress;
export const selectActivityLoading = (state: { userActivity: UserActivityState }) => state.userActivity.isLoading;
export const selectActivityError = (state: { userActivity: UserActivityState }) => state.userActivity.error;
export const selectShowNewDayNotification = (state: { userActivity: UserActivityState }) => state.userActivity.showNewDayNotification;
export const selectMidnightResetInProgress = (state: { userActivity: UserActivityState }) => state.userActivity.midnightResetInProgress;

export default userActivitySlice.reducer;