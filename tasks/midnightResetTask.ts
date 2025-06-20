import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { streakActions } from '../db/actions/streakActions';

// Task name
export const MIDNIGHT_RESET_TASK = 'MIDNIGHT_RESET_TASK';

// Storage keys
const LAST_RESET_DATE_KEY = 'lastResetDate';
const USER_ID_KEY = 'currentUserId';

/**
 * Define the midnight reset background task
 */
export const defineMidnightResetTask = () => {
  TaskManager.defineTask(MIDNIGHT_RESET_TASK, async ({ data, error }) => {
    console.log('[MidnightResetTask] Executing midnight reset task');
    
    if (error) {
      console.error('[MidnightResetTask] Task error:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    try {
      // Get current user ID from storage
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (!userId) {
        console.warn('[MidnightResetTask] No user ID found, skipping reset');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Check if we've already reset today
      const lastResetDate = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
      const today = new Date().toDateString();
      
      if (lastResetDate && new Date(lastResetDate).toDateString() === today) {
        console.log('[MidnightResetTask] Already reset today, skipping');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      console.log('[MidnightResetTask] Performing midnight reset for user:', userId);

      // Perform the midnight reset
      const result = await streakActions.performMidnightReset(userId);
      
      if (result.success) {
        // Update last reset date
        await AsyncStorage.setItem(LAST_RESET_DATE_KEY, new Date().toISOString());

        // Send notification about new day
        await sendNewDayNotification();

        // Log activity metrics
        await logMidnightResetMetrics(userId, result);

        console.log('[MidnightResetTask] Midnight reset completed successfully');
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } else {
        console.error('[MidnightResetTask] Midnight reset failed:', result.error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    } catch (taskError) {
      console.error('[MidnightResetTask] Unexpected error:', taskError);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
};

/**
 * Register the midnight reset background task
 */
export const registerMidnightResetTask = async (): Promise<boolean> => {
  try {
    console.log('[MidnightResetTask] Registering background task');

    // Check if background fetch is available
    const backgroundStatus = await BackgroundFetch.getStatusAsync();
    if (backgroundStatus !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn('[MidnightResetTask] Background fetch not available:', backgroundStatus);
      return false;
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(MIDNIGHT_RESET_TASK);
    if (isRegistered) {
      console.log('[MidnightResetTask] Task already registered');
      return true;
    }

    // Register the background task
    await BackgroundFetch.registerTaskAsync(MIDNIGHT_RESET_TASK, {
      minimumInterval: 60 * 60 * 20, // 20 hours minimum (allows for daily execution)
      stopOnTerminate: false, // Continue running when app is terminated
      startOnBoot: true, // Start when device boots
    });

    console.log('[MidnightResetTask] Background task registered successfully');
    return true;
  } catch (error) {
    console.error('[MidnightResetTask] Failed to register background task:', error);
    return false;
  }
};

/**
 * Unregister the midnight reset background task
 */
export const unregisterMidnightResetTask = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(MIDNIGHT_RESET_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(MIDNIGHT_RESET_TASK);
      console.log('[MidnightResetTask] Background task unregistered');
    }
  } catch (error) {
    console.error('[MidnightResetTask] Failed to unregister background task:', error);
  }
};

/**
 * Get the status of the midnight reset task
 */
export const getMidnightResetTaskStatus = async (): Promise<{
  isRegistered: boolean;
  backgroundFetchStatus: BackgroundFetch.BackgroundFetchStatus;
  lastResetDate?: Date;
}> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(MIDNIGHT_RESET_TASK);
    const backgroundFetchStatus = await BackgroundFetch.getStatusAsync();
    
    const lastResetDateString = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
    const lastResetDate = lastResetDateString ? new Date(lastResetDateString) : undefined;

    return {
      isRegistered,
      backgroundFetchStatus: backgroundFetchStatus || BackgroundFetch.BackgroundFetchStatus.Denied,
      lastResetDate,
    };
  } catch (error) {
    console.error('[MidnightResetTask] Failed to get task status:', error);
    return {
      isRegistered: false,
      backgroundFetchStatus: BackgroundFetch.BackgroundFetchStatus.Denied,
    };
  }
};

/**
 * Manually trigger midnight reset (for testing)
 */
export const triggerMidnightResetManually = async (userId: string): Promise<boolean> => {
  try {
    console.log('[MidnightResetTask] Manually triggering midnight reset');

    // Store user ID for background task
    await AsyncStorage.setItem(USER_ID_KEY, userId);

    // Perform reset
    const result = await streakActions.performMidnightReset(userId);
    
    if (result.success) {
      await AsyncStorage.setItem(LAST_RESET_DATE_KEY, new Date().toISOString());
      await sendNewDayNotification();
      await logMidnightResetMetrics(userId, result);
      
      console.log('[MidnightResetTask] Manual reset completed successfully');
      return true;
    } else {
      console.error('[MidnightResetTask] Manual reset failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('[MidnightResetTask] Manual reset error:', error);
    return false;
  }
};

/**
 * Set user ID for background tasks
 */
export const setUserIdForBackgroundTasks = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
    console.log('[MidnightResetTask] User ID set for background tasks');
  } catch (error) {
    console.error('[MidnightResetTask] Failed to set user ID:', error);
  }
};

/**
 * Clear user data for background tasks (on logout)
 */
export const clearUserDataForBackgroundTasks = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([USER_ID_KEY, LAST_RESET_DATE_KEY]);
    console.log('[MidnightResetTask] User data cleared for background tasks');
  } catch (error) {
    console.error('[MidnightResetTask] Failed to clear user data:', error);
  }
};

/**
 * Send notification about new day starting
 */
const sendNewDayNotification = async (): Promise<void> => {
  try {
    // Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[MidnightResetTask] Notification permissions not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your new day has begun! 🌅',
        body: 'Ready to tackle today\'s goals?',
        data: { 
          type: 'midnight_reset',
          timestamp: new Date().toISOString(),
        },
        sound: false, // Silent notification to avoid disturbing sleep
        priority: Notifications.AndroidNotificationPriority.LOW,
      },
      trigger: null, // Immediate notification
    });

    console.log('[MidnightResetTask] New day notification sent');
  } catch (error) {
    console.error('[MidnightResetTask] Failed to send notification:', error);
  }
};

/**
 * Log metrics about the midnight reset
 */
const logMidnightResetMetrics = async (
  userId: string, 
  result: any
): Promise<void> => {
  try {
    const metrics = {
      userId,
      timestamp: new Date().toISOString(),
      success: result.success,
      streaksUpdated: result.streaks?.length || 0,
      error: result.error,
    };

    // In a real app, you might send this to analytics
    console.log('[MidnightResetTask] Reset metrics:', metrics);

    // Store metrics locally for debugging
    const metricsKey = `midnight_reset_metrics_${new Date().toDateString()}`;
    await AsyncStorage.setItem(metricsKey, JSON.stringify(metrics));
  } catch (error) {
    console.error('[MidnightResetTask] Failed to log metrics:', error);
  }
};

/**
 * Check if midnight reset is needed (for foreground checks)
 */
export const checkIfMidnightResetNeeded = async (userId: string): Promise<boolean> => {
  try {
    const lastResetDate = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
    const today = new Date().toDateString();
    
    if (!lastResetDate) {
      console.log('[MidnightResetTask] No previous reset date, reset needed');
      return true;
    }

    const lastResetDateString = new Date(lastResetDate).toDateString();
    const needsReset = lastResetDateString !== today;
    
    console.log('[MidnightResetTask] Last reset:', lastResetDateString, 'Today:', today, 'Needs reset:', needsReset);
    return needsReset;
  } catch (error) {
    console.error('[MidnightResetTask] Error checking reset status:', error);
    return false;
  }
};