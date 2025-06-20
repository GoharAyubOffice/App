import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { UserStreak } from '../db/model/userStreak';
import { Task } from '../db/model/task';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
  sound?: boolean;
  priority?: Notifications.AndroidNotificationPriority;
}

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Send a local notification
   */
  async sendNotification(options: NotificationOptions): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
          sound: options.sound !== false,
          priority: options.priority || Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: options.categoryId,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  /**
   * Send streak protection notification
   */
  async sendStreakProtectionNotification(
    streak: UserStreak,
    task?: Task
  ): Promise<string | null> {
    try {
      const streakTypeDisplay = this.getStreakTypeDisplay(streak.streakType);
      const taskName = task?.title || streakTypeDisplay;

      const title = "We've got your back! 🛡️";
      const body = `Your streak for "${taskName}" has been protected for today.`;

      return await this.sendNotification({
        title,
        body,
        data: {
          type: 'streak_protection',
          streakId: streak.id,
          taskId: task?.id,
          streakType: streak.streakType,
          protectionDate: new Date().toISOString(),
        },
        categoryId: 'streak_protection',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      });
    } catch (error) {
      console.error('Error sending streak protection notification:', error);
      return null;
    }
  }

  /**
   * Send streak reminder notification
   */
  async sendStreakReminderNotification(
    streak: UserStreak,
    task?: Task
  ): Promise<string | null> {
    try {
      const streakTypeDisplay = this.getStreakTypeDisplay(streak.streakType);
      const taskName = task?.title || streakTypeDisplay;

      const title = "Don't break your streak! 🔥";
      const body = `You haven't completed "${taskName}" today. Keep your ${streak.currentCount}-day streak alive!`;

      return await this.sendNotification({
        title,
        body,
        data: {
          type: 'streak_reminder',
          streakId: streak.id,
          taskId: task?.id,
          streakType: streak.streakType,
          currentCount: streak.currentCount,
        },
        categoryId: 'streak_reminder',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      });
    } catch (error) {
      console.error('Error sending streak reminder notification:', error);
      return null;
    }
  }

  /**
   * Send multiple streak protections notification
   */
  async sendMultipleProtectionsNotification(
    protectedCount: number,
    streaks: UserStreak[]
  ): Promise<string | null> {
    try {
      const title = `${protectedCount} streaks protected! 🛡️`;
      let body;

      if (protectedCount === 1) {
        const streak = streaks[0];
        const streakTypeDisplay = this.getStreakTypeDisplay(streak.streakType);
        body = `Your ${streakTypeDisplay} streak has been automatically protected.`;
      } else if (protectedCount === 2) {
        body = `We've protected your ${streaks.map(s => this.getStreakTypeDisplay(s.streakType)).join(' and ')} streaks.`;
      } else {
        body = `We've automatically protected ${protectedCount} of your streaks for today.`;
      }

      return await this.sendNotification({
        title,
        body,
        data: {
          type: 'multiple_protections',
          protectedCount,
          streakIds: streaks.map(s => s.id),
          protectionDate: new Date().toISOString(),
        },
        categoryId: 'streak_protection',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      });
    } catch (error) {
      console.error('Error sending multiple protections notification:', error);
      return null;
    }
  }

  /**
   * Send streak at risk notification
   */
  async sendStreakAtRiskNotification(
    streak: UserStreak,
    task?: Task,
    hoursRemaining: number = 2
  ): Promise<string | null> {
    try {
      const streakTypeDisplay = this.getStreakTypeDisplay(streak.streakType);
      const taskName = task?.title || streakTypeDisplay;

      const title = `Only ${hoursRemaining} hours left! ⏰`;
      const body = `Complete "${taskName}" to maintain your ${streak.currentCount}-day streak.`;

      return await this.sendNotification({
        title,
        body,
        data: {
          type: 'streak_at_risk',
          streakId: streak.id,
          taskId: task?.id,
          hoursRemaining,
          currentCount: streak.currentCount,
        },
        categoryId: 'streak_reminder',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      });
    } catch (error) {
      console.error('Error sending streak at risk notification:', error);
      return null;
    }
  }

  /**
   * Send congratulations notification for streak milestone
   */
  async sendStreakMilestoneNotification(
    streak: UserStreak,
    milestone: number,
    task?: Task
  ): Promise<string | null> {
    try {
      const streakTypeDisplay = this.getStreakTypeDisplay(streak.streakType);
      const taskName = task?.title || streakTypeDisplay;

      const title = `${milestone} days strong! 🎉`;
      const body = `Congratulations on your ${milestone}-day "${taskName}" streak!`;

      return await this.sendNotification({
        title,
        body,
        data: {
          type: 'streak_milestone',
          streakId: streak.id,
          taskId: task?.id,
          milestone,
          currentCount: streak.currentCount,
        },
        categoryId: 'streak_celebration',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      });
    } catch (error) {
      console.error('Error sending streak milestone notification:', error);
      return null;
    }
  }

  /**
   * Schedule evening streak check notification
   */
  async scheduleEveningStreakCheck(hour: number = 20): Promise<string | null> {
    try {
      const trigger: Notifications.NotificationTriggerInput = {
        type: 'timeInterval',
        seconds: 86400, // Daily (24 hours)
        repeats: true,
      };

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: "How's your day going? 🌅",
          body: "Check in on your daily goals and habits.",
          data: {
            type: 'evening_check',
            scheduledAt: new Date().toISOString(),
          },
          categoryIdentifier: 'daily_reminder',
        },
        trigger,
      });
    } catch (error) {
      console.error('Error scheduling evening streak check:', error);
      return null;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Get display name for streak type
   */
  private getStreakTypeDisplay(streakType: string): string {
    switch (streakType) {
      case 'daily_completion':
        return 'Daily Tasks';
      case 'weekly_goal':
        return 'Weekly Goals';
      case 'habit_consistency':
        return 'Habit Tracking';
      default:
        return streakType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  /**
   * Set up notification categories (for iOS action buttons)
   */
  async setupNotificationCategories(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('streak_protection', [
          {
            identifier: 'view_streak',
            buttonTitle: 'View Streak',
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: 'dismiss',
            buttonTitle: 'Dismiss',
            options: {
              opensAppToForeground: false,
            },
          },
        ]);

        await Notifications.setNotificationCategoryAsync('streak_reminder', [
          {
            identifier: 'complete_now',
            buttonTitle: 'Complete Now',
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: 'remind_later',
            buttonTitle: 'Remind Later',
            options: {
              opensAppToForeground: false,
            },
          },
        ]);

        await Notifications.setNotificationCategoryAsync('streak_celebration', [
          {
            identifier: 'share',
            buttonTitle: 'Share',
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: 'view_stats',
            buttonTitle: 'View Stats',
            options: {
              opensAppToForeground: true,
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();