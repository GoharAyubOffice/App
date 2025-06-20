import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { UserStreak } from '../model/userStreak';
import { DailyActivity } from '../model/dailyActivity';
import { Task } from '../model/task';
import { TaskCompletion } from '../model/taskCompletion';
import { StreakProtection } from '../model/streakProtection';

export interface StreakUpdateResult {
  success: boolean;
  streaks?: UserStreak[];
  dailyActivity?: DailyActivity;
  protections?: StreakProtection[];
  error?: string;
}

export interface StreakProtectionResult {
  success: boolean;
  protection?: StreakProtection;
  streak?: UserStreak;
  canProtect?: boolean;
  reason?: string;
  error?: string;
}

export const streakActions = {
  /**
   * Update user's daily activity and streaks
   */
  updateDailyActivity: async (
    userId: string,
    date: Date = new Date()
  ): Promise<StreakUpdateResult> => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await database.write(async () => {
        // Get today's task completion data
        const completions = await database.collections
          .get<TaskCompletion>('task_completions')
          .query(
            Q.where('completed_by', userId),
            Q.where('completed_at', Q.between(startOfDay.getTime(), endOfDay.getTime()))
          )
          .fetch();

        // Get today's tasks
        const allTasks = await database.collections
          .get<Task>('tasks')
          .query(
            Q.where('created_by', userId)
          )
          .fetch();

        const todayTasks = allTasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === date.toDateString();
        });

        const tasksCompleted = completions.length;
        const totalTasks = todayTasks.length;
        const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

        // Find or create daily activity record
        const existingActivity = await database.collections
          .get<DailyActivity>('daily_activities')
          .query(
            Q.where('user_id', userId),
            Q.where('activity_date', startOfDay.getTime())
          )
          .fetch();

        let dailyActivity: DailyActivity;

        if (existingActivity.length > 0) {
          dailyActivity = existingActivity[0];
          await dailyActivity.update(record => {
            record.tasksCompleted = tasksCompleted;
            record.totalTasks = totalTasks;
            record.completionRate = completionRate;
            record.habitCompletions = completions.filter(c => c.completionType === 'habit').length;
            record.updatedAt = new Date();
            record.isDirty = true;
          });
        } else {
          dailyActivity = await database.collections
            .get<DailyActivity>('daily_activities')
            .create(record => {
              record.userId = userId;
              record.activityDate = startOfDay;
              record.tasksCompleted = tasksCompleted;
              record.tasksCreated = todayTasks.length;
              record.totalTasks = totalTasks;
              record.completionRate = completionRate;
              record.activeTimeMinutes = 0; // Can be updated separately
              record.habitCompletions = completions.filter(c => c.completionType === 'habit').length;
              record.streakDays = 0; // Will be calculated
              record.goalsAchieved = 0; // Can be updated separately
              record.metadata = '{}';
              record.createdAt = new Date();
              record.updatedAt = new Date();
              record.isDirty = true;
            });
        }

        // Update streaks
        const streaks = await streakActions.updateUserStreaks(userId, date, tasksCompleted > 0);

        return {
          success: true,
          streaks,
          dailyActivity,
        };
      });
    } catch (error) {
      console.error('Error updating daily activity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Update user streaks based on activity
   */
  updateUserStreaks: async (
    userId: string,
    date: Date = new Date(),
    hasActivity: boolean = false
  ): Promise<UserStreak[]> => {
    try {
      const today = new Date(date);
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get existing streaks
      const existingStreaks = await database.collections
        .get<UserStreak>('user_streaks')
        .query(
          Q.where('user_id', userId)
        )
        .fetch();

      const streaks: UserStreak[] = [];

      // Update daily completion streak
      let dailyStreak = existingStreaks.find(s => s.streakType === 'daily_completion');
      
      if (dailyStreak) {
        await dailyStreak.update(record => {
          const lastActivity = new Date(record.lastActivityDate);
          lastActivity.setHours(0, 0, 0, 0);

          if (hasActivity) {
            // Has activity today
            if (lastActivity.getTime() === yesterday.getTime()) {
              // Consecutive day
              record.currentCount += 1;
            } else if (lastActivity.getTime() !== today.getTime()) {
              // Reset streak if gap > 1 day
              record.currentCount = 1;
              record.streakStartDate = today;
            }
            
            record.lastActivityDate = today;
            record.isActive = true;
            
            if (record.currentCount > record.longestCount) {
              record.longestCount = record.currentCount;
            }
          } else {
            // No activity today
            if (lastActivity.getTime() === yesterday.getTime()) {
              // Streak continues for grace period (could be extended)
              record.isActive = true;
            } else if (lastActivity.getTime() < yesterday.getTime()) {
              // Streak broken
              record.currentCount = 0;
              record.isActive = false;
            }
          }

          record.updatedAt = new Date();
          record.isDirty = true;
        });
      } else if (hasActivity) {
        // Create new daily streak
        dailyStreak = await database.collections
          .get<UserStreak>('user_streaks')
          .create(record => {
            record.userId = userId;
            record.streakType = 'daily_completion';
            record.currentCount = 1;
            record.longestCount = 1;
            record.lastActivityDate = today;
            record.streakStartDate = today;
            record.isActive = true;
            record.metadata = '{}';
            record.createdAt = new Date();
            record.updatedAt = new Date();
            record.isDirty = true;
          });
      }

      if (dailyStreak) {
        streaks.push(dailyStreak);
      }

      return streaks;
    } catch (error) {
      console.error('Error updating user streaks:', error);
      return [];
    }
  },

  /**
   * Get user's current streaks
   */
  getUserStreaks: async (userId: string): Promise<UserStreak[]> => {
    try {
      return await database.collections
        .get<UserStreak>('user_streaks')
        .query(
          Q.where('user_id', userId),
          Q.sortBy('updated_at', Q.desc)
        )
        .fetch();
    } catch (error) {
      console.error('Error fetching user streaks:', error);
      return [];
    }
  },

  /**
   * Get user's daily activity for a date range
   */
  getDailyActivities: async (
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyActivity[]> => {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return await database.collections
        .get<DailyActivity>('daily_activities')
        .query(
          Q.where('user_id', userId),
          Q.where('activity_date', Q.between(start.getTime(), end.getTime())),
          Q.sortBy('activity_date', Q.desc)
        )
        .fetch();
    } catch (error) {
      console.error('Error fetching daily activities:', error);
      return [];
    }
  },

  /**
   * Reset daily data (for midnight reset)
   */
  performMidnightReset: async (userId: string): Promise<StreakUpdateResult> => {
    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Update streaks based on yesterday's activity
      const yesterdayActivity = await database.collections
        .get<DailyActivity>('daily_activities')
        .query(
          Q.where('user_id', userId),
          Q.where('activity_date', yesterday.getTime())
        )
        .fetch();

      const hadActivity = yesterdayActivity.length > 0 && yesterdayActivity[0].tasksCompleted > 0;

      // Update streaks
      const streaks = await streakActions.updateUserStreaks(userId, today, false);

      // Create today's activity record with zero values
      await streakActions.updateDailyActivity(userId, today);

      return {
        success: true,
        streaks,
      };
    } catch (error) {
      console.error('Error performing midnight reset:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Get streak statistics
   */
  getStreakStats: async (userId: string): Promise<{
    dailyStreak: number;
    longestStreak: number;
    totalCompletions: number;
    averageCompletionRate: number;
  }> => {
    try {
      const streaks = await streakActions.getUserStreaks(userId);
      const dailyStreak = streaks.find(s => s.streakType === 'daily_completion');

      // Get last 30 days of activity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activities = await streakActions.getDailyActivities(userId, thirtyDaysAgo, new Date());
      
      const totalCompletions = activities.reduce((sum, activity) => sum + activity.tasksCompleted, 0);
      const averageCompletionRate = activities.length > 0 
        ? activities.reduce((sum, activity) => sum + activity.completionRate, 0) / activities.length
        : 0;

      return {
        dailyStreak: dailyStreak?.currentCount || 0,
        longestStreak: dailyStreak?.longestCount || 0,
        totalCompletions,
        averageCompletionRate,
      };
    } catch (error) {
      console.error('Error getting streak stats:', error);
      return {
        dailyStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
      };
    }
  },

  /**
   * Apply streak protection for a user
   */
  applyStreakProtection: async (
    userId: string,
    streakId: string,
    protectionType: 'auto' | 'manual' | 'premium' = 'auto',
    reason: string = 'Automatic protection applied',
    taskId?: string
  ): Promise<StreakProtectionResult> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await database.write(async () => {
        // Get the streak
        const streak = await database.collections
          .get<UserStreak>('user_streaks')
          .find(streakId);

        if (!streak) {
          return {
            success: false,
            error: 'Streak not found',
          };
        }

        // Check if protection can be applied
        const canProtect = await streakActions.canApplyProtection(userId, streakId);
        if (!canProtect.canProtect) {
          return {
            success: false,
            canProtect: false,
            reason: canProtect.reason,
          };
        }

        // Check if already protected today
        if (streak.isProtectedToday) {
          return {
            success: false,
            reason: 'Streak already protected today',
          };
        }

        // Apply protection to streak
        await streak.update(record => {
          record.isProtectedToday = true;
          record.usedProtections += 1;
          record.availableProtections = Math.max(0, record.availableProtections - 1);
          record.updatedAt = new Date();
          record.isDirty = true;
        });

        // Create protection record
        const protection = await database.collections
          .get<StreakProtection>('streak_protections')
          .create(record => {
            record.userId = userId;
            record.streakId = streakId;
            record.taskId = taskId;
            record.protectionDate = today;
            record.protectionType = protectionType;
            record.reason = reason;
            record.availableProtections = streak.availableProtections;
            record.usedProtections = streak.usedProtections;
            record.metadata = JSON.stringify({
              originalStreakCount: streak.currentCount,
              appliedAt: new Date().toISOString(),
            });
            record.createdAt = new Date();
            record.isDirty = true;
          });

        return {
          success: true,
          protection,
          streak,
          canProtect: true,
        };
      });
    } catch (error) {
      console.error('Error applying streak protection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Check if protection can be applied
   */
  canApplyProtection: async (userId: string, streakId: string): Promise<{
    canProtect: boolean;
    reason?: string;
    availableProtections?: number;
  }> => {
    try {
      const streak = await database.collections
        .get<UserStreak>('user_streaks')
        .find(streakId);

      if (!streak) {
        return {
          canProtect: false,
          reason: 'Streak not found',
        };
      }

      if (streak.availableProtections <= 0) {
        return {
          canProtect: false,
          reason: 'No protections available',
          availableProtections: 0,
        };
      }

      if (streak.isProtectedToday) {
        return {
          canProtect: false,
          reason: 'Already protected today',
          availableProtections: streak.availableProtections,
        };
      }

      // Check if streak is at risk (no activity today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActivity = new Date(streak.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      if (lastActivity.getTime() === today.getTime()) {
        return {
          canProtect: false,
          reason: 'Streak already maintained today',
          availableProtections: streak.availableProtections,
        };
      }

      return {
        canProtect: true,
        availableProtections: streak.availableProtections,
      };
    } catch (error) {
      console.error('Error checking protection eligibility:', error);
      return {
        canProtect: false,
        reason: 'Error checking eligibility',
      };
    }
  },

  /**
   * Check for streaks that need protection (evening check)
   */
  checkStreaksNeedingProtection: async (userId: string): Promise<{
    streaksAtRisk: UserStreak[];
    protectableStreaks: UserStreak[];
  }> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active streaks for user
      const streaks = await database.collections
        .get<UserStreak>('user_streaks')
        .query(
          Q.where('user_id', userId),
          Q.where('is_active', true),
          Q.where('current_count', Q.gt(0))
        )
        .fetch();

      const streaksAtRisk: UserStreak[] = [];
      const protectableStreaks: UserStreak[] = [];

      for (const streak of streaks) {
        const lastActivity = new Date(streak.lastActivityDate);
        lastActivity.setHours(0, 0, 0, 0);

        // Check if no activity today and not already protected
        if (lastActivity.getTime() !== today.getTime() && !streak.isProtectedToday) {
          streaksAtRisk.push(streak);

          // Check if protection can be applied
          const canProtect = await streakActions.canApplyProtection(userId, streak.id);
          if (canProtect.canProtect) {
            protectableStreaks.push(streak);
          }
        }
      }

      return {
        streaksAtRisk,
        protectableStreaks,
      };
    } catch (error) {
      console.error('Error checking streaks needing protection:', error);
      return {
        streaksAtRisk: [],
        protectableStreaks: [],
      };
    }
  },

  /**
   * Initialize streak protections for new user
   */
  initializeStreakProtections: async (userId: string): Promise<void> => {
    try {
      await database.write(async () => {
        const streaks = await database.collections
          .get<UserStreak>('user_streaks')
          .query(Q.where('user_id', userId))
          .fetch();

        for (const streak of streaks) {
          // Give new users 3 protections per month
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          nextMonth.setHours(0, 0, 0, 0);

          await streak.update(record => {
            record.availableProtections = 3;
            record.usedProtections = 0;
            record.protectionResetDate = nextMonth;
            record.isProtectedToday = false;
            record.updatedAt = new Date();
            record.isDirty = true;
          });
        }
      });
    } catch (error) {
      console.error('Error initializing streak protections:', error);
    }
  },

  /**
   * Reset monthly protections
   */
  resetMonthlyProtections: async (userId: string): Promise<void> => {
    try {
      await database.write(async () => {
        const streaks = await database.collections
          .get<UserStreak>('user_streaks')
          .query(Q.where('user_id', userId))
          .fetch();

        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);

        for (const streak of streaks) {
          await streak.update(record => {
            record.availableProtections = 3; // Reset to 3 per month
            record.usedProtections = 0;
            record.protectionResetDate = nextMonth;
            record.isProtectedToday = false;
            record.updatedAt = new Date();
            record.isDirty = true;
          });
        }
      });
    } catch (error) {
      console.error('Error resetting monthly protections:', error);
    }
  },

  /**
   * Get protection history for a user
   */
  getProtectionHistory: async (userId: string, days: number = 30): Promise<StreakProtection[]> => {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      return await database.collections
        .get<StreakProtection>('streak_protections')
        .query(
          Q.where('user_id', userId),
          Q.where('protection_date', Q.gte(sinceDate.getTime())),
          Q.sortBy('protection_date', Q.desc)
        )
        .fetch();
    } catch (error) {
      console.error('Error getting protection history:', error);
      return [];
    }
  },
};