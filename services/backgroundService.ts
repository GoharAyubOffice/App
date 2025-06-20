import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { streakActions } from '../db/actions/streakActions';
import { store } from '../store';
import { performMidnightReset, setShowNewDayNotification } from '../store/slices/userActivitySlice';
import { 
  STREAK_MONITOR_TASK,
  defineStreakMonitorTask,
  registerStreakMonitorTask,
  setUserIdForStreakMonitor,
  checkIfStreakCheckNeeded,
  triggerStreakMonitorManually
} from '../tasks/streakMonitorTask';
import { notificationService } from './notificationService';

// Background task names
export const MIDNIGHT_RESET_TASK = 'MIDNIGHT_RESET_TASK';
export const PERIODIC_SYNC_TASK = 'PERIODIC_SYNC_TASK';

// Background task status
let isBackgroundTasksRegistered = false;
let lastResetDate: string | null = null;

interface BackgroundTaskData {
  userId?: string;
  lastExecution?: number;
  error?: string;
}

/**
 * Background service for handling midnight resets and periodic tasks
 */
export class BackgroundService {
  private static instance: BackgroundService;
  private appStateChangeListener?: ((nextAppState: AppStateStatus) => void);
  private midnightCheckInterval?: number;
  private appStateSubscription?: { remove: () => void };

  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  /**
   * Initialize background services
   */
  async initialize(userId: string): Promise<void> {
    try {
      console.log('Initializing background service for user:', userId);

      // Request permissions and setup notifications
      await this.requestPermissions();
      await notificationService.setupNotificationCategories();

      // Register background tasks
      await this.registerBackgroundTasks(userId);

      // Set up app state monitoring
      this.setupAppStateMonitoring(userId);

      // Check if we need to perform initial reset or streak check
      await this.checkForMidnightReset(userId);
      await this.checkForStreakMonitor(userId);

      console.log('Background service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize background service:', error);
    }
  }

  /**
   * Request necessary permissions
   */
  private async requestPermissions(): Promise<void> {
    try {
      // Request notification permissions
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        console.warn('Notification permissions not granted');
      }

      // Request background fetch permissions
      const status = await BackgroundFetch.getStatusAsync();
      if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
        console.warn('Background fetch not available:', status);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }

  /**
   * Register background tasks
   */
  private async registerBackgroundTasks(userId: string): Promise<void> {
    try {
      if (isBackgroundTasksRegistered) {
        console.log('Background tasks already registered');
        return;
      }

      // Define midnight reset task
      TaskManager.defineTask(MIDNIGHT_RESET_TASK, async ({ data, error }) => {
        console.log('Executing midnight reset task');
        
        if (error) {
          console.error('Midnight reset task error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }

        try {
          const taskData = data as BackgroundTaskData;
          const currentUserId = taskData.userId || userId;

          // Perform midnight reset
          const result = await streakActions.performMidnightReset(currentUserId);
          
          if (result.success) {
            // Update Redux store if app is active
            if (store.getState().auth.isAuthenticated) {
              store.dispatch(performMidnightReset(currentUserId));
            }

            // Send local notification if app is not in foreground
            if (AppState.currentState !== 'active') {
              await this.sendMidnightResetNotification();
            }

            lastResetDate = new Date().toISOString();
            console.log('Midnight reset completed successfully');
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } else {
            console.error('Midnight reset failed:', result.error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
        } catch (taskError) {
          console.error('Error in midnight reset task:', taskError);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Define and register streak monitor task
      defineStreakMonitorTask();
      
      // Register background fetch tasks
      await BackgroundFetch.registerTaskAsync(MIDNIGHT_RESET_TASK, {
        minimumInterval: 60 * 60 * 20, // 20 hours minimum interval
        stopOnTerminate: false,
        startOnBoot: true,
      });

      await registerStreakMonitorTask();

      // Set user IDs for background tasks
      await setUserIdForStreakMonitor(userId);

      isBackgroundTasksRegistered = true;
      console.log('Background tasks registered successfully');
    } catch (error) {
      console.error('Failed to register background tasks:', error);
    }
  }

  /**
   * Set up app state monitoring for foreground midnight checks
   */
  private setupAppStateMonitoring(userId: string): void {
    this.appStateChangeListener = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active, check for midnight reset and streak monitor
        this.checkForMidnightReset(userId);
        this.checkForStreakMonitor(userId);
      }
    };

    // Store the subscription
    this.appStateSubscription = AppState.addEventListener('change', this.appStateChangeListener);

    // Set up periodic check while app is active
    this.midnightCheckInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        this.checkForMidnightReset(userId);
      }
    }, 60000); // Check every minute when app is active
  }

  /**
   * Check if midnight reset is needed
   */
  private async checkForMidnightReset(userId: string): Promise<void> {
    try {
      const now = new Date();
      const today = now.toDateString();
      
      // Check if we've already reset today
      if (lastResetDate && new Date(lastResetDate).toDateString() === today) {
        return;
      }

      // Check if it's a new day since last app usage
      const lastUsageDate = this.getLastUsageDate();
      if (lastUsageDate && lastUsageDate !== today) {
        console.log('New day detected, performing midnight reset');
        
        // Perform reset
        const result = await streakActions.performMidnightReset(userId);
        
        if (result.success) {
          // Update Redux store
          store.dispatch(performMidnightReset(userId));
          store.dispatch(setShowNewDayNotification(true));
          
          lastResetDate = now.toISOString();
          this.setLastUsageDate(today);
          
          console.log('Foreground midnight reset completed');
        }
      } else {
        // Update last usage for current session
        this.setLastUsageDate(today);
      }
    } catch (error) {
      console.error('Error checking for midnight reset:', error);
    }
  }

  /**
   * Check if streak monitor needs to run
   */
  private async checkForStreakMonitor(userId: string): Promise<void> {
    try {
      const needsCheck = await checkIfStreakCheckNeeded();
      
      if (needsCheck) {
        console.log('Streak check needed, running foreground check');
        
        // Run streak monitor check
        const result = await triggerStreakMonitorManually(userId);
        
        if (result.success) {
          console.log(`Foreground streak monitor completed: ${result.protectedCount} streaks protected`);
        } else {
          console.error('Foreground streak monitor failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Error checking for streak monitor:', error);
    }
  }

  /**
   * Send midnight reset notification
   */
  private async sendMidnightResetNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your new day has begun! 🌅',
          body: 'Ready to tackle today\'s goals?',
          sound: false, // Silent notification
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error sending midnight reset notification:', error);
    }
  }

  /**
   * Manual trigger for midnight reset (for testing)
   */
  async triggerMidnightReset(userId: string): Promise<void> {
    try {
      console.log('Manually triggering midnight reset');
      
      const result = await streakActions.performMidnightReset(userId);
      
      if (result.success) {
        store.dispatch(performMidnightReset(userId));
        store.dispatch(setShowNewDayNotification(true));
        lastResetDate = new Date().toISOString();
        console.log('Manual midnight reset completed');
      } else {
        console.error('Manual midnight reset failed:', result.error);
      }
    } catch (error) {
      console.error('Error in manual midnight reset:', error);
    }
  }

  /**
   * Get last usage date from storage
   */
  private getLastUsageDate(): string | null {
    // In a real app, this would be stored in AsyncStorage
    // For now, we'll use a simple in-memory approach
    return lastResetDate ? new Date(lastResetDate).toDateString() : null;
  }

  /**
   * Set last usage date in storage
   */
  private setLastUsageDate(date: string): void {
    // In a real app, this would be stored in AsyncStorage
    // For now, we'll use a simple in-memory approach
    lastResetDate = new Date(date).toISOString();
  }

  /**
   * Stop background services
   */
  async stop(): Promise<void> {
    try {
      // Unregister background tasks
      if (isBackgroundTasksRegistered) {
        await BackgroundFetch.unregisterTaskAsync(MIDNIGHT_RESET_TASK);
        isBackgroundTasksRegistered = false;
      }

      // Remove app state listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = undefined;
      }

      // Clear intervals
      if (this.midnightCheckInterval) {
        clearInterval(this.midnightCheckInterval);
        this.midnightCheckInterval = undefined;
      }

      console.log('Background service stopped');
    } catch (error) {
      console.error('Error stopping background service:', error);
    }
  }

  /**
   * Get background task status
   */
  async getBackgroundTaskStatus(): Promise<{
    isRegistered: boolean;
    lastExecution?: Date;
    status?: BackgroundFetch.BackgroundFetchStatus;
  }> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      
      return {
        isRegistered: isBackgroundTasksRegistered,
        lastExecution: lastResetDate ? new Date(lastResetDate) : undefined,
        status: status ?? undefined,
      };
    } catch (error) {
      console.error('Error getting background task status:', error);
      return {
        isRegistered: false,
      };
    }
  }
}

// Export singleton instance
export const backgroundService = BackgroundService.getInstance();