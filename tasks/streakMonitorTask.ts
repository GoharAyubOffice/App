import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { streakActions } from '../db/actions/streakActions';
import { notificationService } from '../services/notificationService';

// Task name
export const STREAK_MONITOR_TASK = 'STREAK_MONITOR_TASK';

// Storage keys
const LAST_STREAK_CHECK_KEY = 'lastStreakCheck';
const STREAK_MONITOR_USER_ID_KEY = 'streakMonitorUserId';

/**
 * Define the streak monitor background task
 */
export const defineStreakMonitorTask = () => {
  TaskManager.defineTask(STREAK_MONITOR_TASK, async ({ data, error }) => {
    console.log('[StreakMonitor] Executing streak monitor task');
    
    if (error) {
      console.error('[StreakMonitor] Task error:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    try {
      // Get current user ID from storage
      const userId = await AsyncStorage.getItem(STREAK_MONITOR_USER_ID_KEY);
      if (!userId) {
        console.warn('[StreakMonitor] No user ID found, skipping check');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Check if we've already checked today
      const lastCheckDate = await AsyncStorage.getItem(LAST_STREAK_CHECK_KEY);
      const today = new Date();
      const todayString = today.toDateString();
      
      if (lastCheckDate && new Date(lastCheckDate).toDateString() === todayString) {
        console.log('[StreakMonitor] Already checked today, skipping');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Only run in evening (after 6 PM)
      const currentHour = today.getHours();
      if (currentHour < 18) {
        console.log('[StreakMonitor] Too early for streak check, skipping');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      console.log('[StreakMonitor] Checking streaks needing protection for user:', userId);

      // Check for streaks that need protection
      const { streaksAtRisk, protectableStreaks } = await streakActions.checkStreaksNeedingProtection(userId);
      
      if (protectableStreaks.length === 0) {
        console.log('[StreakMonitor] No streaks need protection');
        await AsyncStorage.setItem(LAST_STREAK_CHECK_KEY, today.toISOString());
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      console.log(`[StreakMonitor] Found ${protectableStreaks.length} streaks that can be protected`);

      // Apply protection to eligible streaks
      const protectedStreaks = [];
      const protectionResults = [];

      for (const streak of protectableStreaks) {
        try {
          const result = await streakActions.applyStreakProtection(
            userId,
            streak.id,
            'auto',
            'Automatic evening protection'
          );

          if (result.success && result.protection) {
            protectedStreaks.push(streak);
            protectionResults.push(result);
            console.log(`[StreakMonitor] Protected streak: ${streak.streakType}`);
          } else {
            console.warn(`[StreakMonitor] Failed to protect streak ${streak.id}:`, result.reason);
          }
        } catch (error) {
          console.error(`[StreakMonitor] Error protecting streak ${streak.id}:`, error);
        }
      }

      // Send notifications for protected streaks
      if (protectedStreaks.length > 0) {
        await sendProtectionNotifications(protectedStreaks);
        await logProtectionMetrics(userId, protectedStreaks, streaksAtRisk);
      }

      // Update last check date
      await AsyncStorage.setItem(LAST_STREAK_CHECK_KEY, today.toISOString());

      console.log(`[StreakMonitor] Streak monitor completed: ${protectedStreaks.length} streaks protected`);
      return BackgroundFetch.BackgroundFetchResult.NewData;
      
    } catch (taskError) {
      console.error('[StreakMonitor] Unexpected error:', taskError);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
};

/**
 * Register the streak monitor background task
 */
export const registerStreakMonitorTask = async (): Promise<boolean> => {
  try {
    console.log('[StreakMonitor] Registering background task');

    // Check if background fetch is available
    const backgroundStatus = await BackgroundFetch.getStatusAsync();
    if (backgroundStatus !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn('[StreakMonitor] Background fetch not available:', backgroundStatus);
      return false;
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(STREAK_MONITOR_TASK);
    if (isRegistered) {
      console.log('[StreakMonitor] Task already registered');
      return true;
    }

    // Register the background task with evening schedule preference
    await BackgroundFetch.registerTaskAsync(STREAK_MONITOR_TASK, {
      minimumInterval: 60 * 60 * 6, // 6 hours minimum (allows for multiple daily checks)
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[StreakMonitor] Background task registered successfully');
    return true;
  } catch (error) {
    console.error('[StreakMonitor] Failed to register background task:', error);
    return false;
  }
};

/**
 * Unregister the streak monitor background task
 */
export const unregisterStreakMonitorTask = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(STREAK_MONITOR_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(STREAK_MONITOR_TASK);
      console.log('[StreakMonitor] Background task unregistered');
    }
  } catch (error) {
    console.error('[StreakMonitor] Failed to unregister background task:', error);
  }
};

/**
 * Get the status of the streak monitor task
 */
export const getStreakMonitorTaskStatus = async (): Promise<{
  isRegistered: boolean;
  backgroundFetchStatus: BackgroundFetch.BackgroundFetchStatus;
  lastCheckDate?: Date;
}> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(STREAK_MONITOR_TASK);
    const backgroundFetchStatus = await BackgroundFetch.getStatusAsync();
    
    const lastCheckString = await AsyncStorage.getItem(LAST_STREAK_CHECK_KEY);
    const lastCheckDate = lastCheckString ? new Date(lastCheckString) : undefined;

    return {
      isRegistered,
      backgroundFetchStatus: backgroundFetchStatus || BackgroundFetch.BackgroundFetchStatus.Denied,
      lastCheckDate,
    };
  } catch (error) {
    console.error('[StreakMonitor] Failed to get task status:', error);
    return {
      isRegistered: false,
      backgroundFetchStatus: BackgroundFetch.BackgroundFetchStatus.Denied,
    };
  }
};

/**
 * Manually trigger streak monitor (for testing)
 */
export const triggerStreakMonitorManually = async (userId: string): Promise<{
  success: boolean;
  protectedCount: number;
  atRiskCount: number;
  error?: string;
}> => {
  try {
    console.log('[StreakMonitor] Manually triggering streak monitor');

    // Store user ID for background task
    await AsyncStorage.setItem(STREAK_MONITOR_USER_ID_KEY, userId);

    // Check for streaks needing protection
    const { streaksAtRisk, protectableStreaks } = await streakActions.checkStreaksNeedingProtection(userId);
    
    console.log(`[StreakMonitor] Found ${streaksAtRisk.length} at-risk streaks, ${protectableStreaks.length} protectable`);

    // Apply protections
    const protectedStreaks = [];
    
    for (const streak of protectableStreaks) {
      const result = await streakActions.applyStreakProtection(
        userId,
        streak.id,
        'manual',
        'Manual streak protection test'
      );

      if (result.success) {
        protectedStreaks.push(streak);
      }
    }

    // Send notifications
    if (protectedStreaks.length > 0) {
      await sendProtectionNotifications(protectedStreaks);
      await logProtectionMetrics(userId, protectedStreaks, streaksAtRisk);
    }

    // Update last check
    await AsyncStorage.setItem(LAST_STREAK_CHECK_KEY, new Date().toISOString());

    console.log(`[StreakMonitor] Manual trigger completed: ${protectedStreaks.length} streaks protected`);
    
    return {
      success: true,
      protectedCount: protectedStreaks.length,
      atRiskCount: streaksAtRisk.length,
    };
  } catch (error) {
    console.error('[StreakMonitor] Manual trigger error:', error);
    return {
      success: false,
      protectedCount: 0,
      atRiskCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Set user ID for background tasks
 */
export const setUserIdForStreakMonitor = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STREAK_MONITOR_USER_ID_KEY, userId);
    console.log('[StreakMonitor] User ID set for background tasks');
  } catch (error) {
    console.error('[StreakMonitor] Failed to set user ID:', error);
  }
};

/**
 * Clear user data for background tasks (on logout)
 */
export const clearUserDataForStreakMonitor = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([STREAK_MONITOR_USER_ID_KEY, LAST_STREAK_CHECK_KEY]);
    console.log('[StreakMonitor] User data cleared for background tasks');
  } catch (error) {
    console.error('[StreakMonitor] Failed to clear user data:', error);
  }
};

/**
 * Check if streak check is needed (for foreground checks)
 */
export const checkIfStreakCheckNeeded = async (): Promise<boolean> => {
  try {
    const lastCheckDate = await AsyncStorage.getItem(LAST_STREAK_CHECK_KEY);
    const today = new Date().toDateString();
    
    if (!lastCheckDate) {
      console.log('[StreakMonitor] No previous check date, check needed');
      return true;
    }

    const lastCheckDateString = new Date(lastCheckDate).toDateString();
    const needsCheck = lastCheckDateString !== today;
    
    // Also check time - only needed in evening
    const currentHour = new Date().getHours();
    const isEvening = currentHour >= 18;
    
    console.log('[StreakMonitor] Last check:', lastCheckDateString, 'Today:', today, 'Evening:', isEvening, 'Needs check:', needsCheck && isEvening);
    return needsCheck && isEvening;
  } catch (error) {
    console.error('[StreakMonitor] Error checking streak check status:', error);
    return false;
  }
};

/**
 * Send protection notifications
 */
const sendProtectionNotifications = async (protectedStreaks: any[]): Promise<void> => {
  try {
    if (protectedStreaks.length === 1) {
      // Single streak protection
      await notificationService.sendStreakProtectionNotification(protectedStreaks[0]);
    } else if (protectedStreaks.length > 1) {
      // Multiple streaks protection
      await notificationService.sendMultipleProtectionsNotification(
        protectedStreaks.length,
        protectedStreaks
      );
    }

    console.log(`[StreakMonitor] Sent protection notifications for ${protectedStreaks.length} streaks`);
  } catch (error) {
    console.error('[StreakMonitor] Failed to send notifications:', error);
  }
};

/**
 * Log metrics about the streak protection
 */
const logProtectionMetrics = async (
  userId: string,
  protectedStreaks: any[],
  streaksAtRisk: any[]
): Promise<void> => {
  try {
    const metrics = {
      userId,
      timestamp: new Date().toISOString(),
      protectedCount: protectedStreaks.length,
      atRiskCount: streaksAtRisk.length,
      protectedStreakTypes: protectedStreaks.map(s => s.streakType),
      protectionHour: new Date().getHours(),
    };

    // In a real app, you might send this to analytics
    console.log('[StreakMonitor] Protection metrics:', metrics);

    // Store metrics locally for debugging
    const metricsKey = `streak_protection_metrics_${new Date().toDateString()}`;
    await AsyncStorage.setItem(metricsKey, JSON.stringify(metrics));
  } catch (error) {
    console.error('[StreakMonitor] Failed to log metrics:', error);
  }
};