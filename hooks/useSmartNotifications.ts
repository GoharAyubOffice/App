import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '../store/hooks';
import { notificationPersonalizer, PersonalizationSettings } from '../services/notificationPersonalizer';
import { notificationService, NotificationTiming } from '../services/notificationService';
import { taskCompletionActions } from '../db/actions/taskCompletionActions';
import { Task } from '../db/model/task';

export interface SmartNotificationHookResult {
  settings: PersonalizationSettings | null;
  loading: boolean;
  error: string | null;
  hasPermissions: boolean;
  
  // Actions
  updateSettings: (newSettings: Partial<PersonalizationSettings>) => Promise<void>;
  scheduleSmartReminder: (task: Task, timing: NotificationTiming, options?: { triggerType?: 'daily' | 'weekly' | 'custom'; customMessage?: string; }) => Promise<string | null>;
  updateAllSmartNotifications: () => Promise<void>;
  checkPermissions: () => Promise<boolean>;
  analyzeUserPatterns: () => Promise<void>;
  
  // Data
  userProfile: any; // UserNotificationProfile
  scheduledReminders: any[]; // Notifications
}

export const useSmartNotifications = (): SmartNotificationHookResult => {
  const currentUser = useCurrentUser();
  const [settings, setSettings] = useState<PersonalizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [scheduledReminders, setScheduledReminders] = useState([]);

  // Load initial data
  useEffect(() => {
    if (currentUser?.id) {
      initialize();
    }
  }, [currentUser?.id]);

  const initialize = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check permissions
      const perms = await notificationService.requestPermissions();
      setHasPermissions(perms);

      if (perms) {
        // Load settings
        const userSettings = await notificationPersonalizer.getUserSettings(currentUser!.id);
        setSettings(userSettings);

        // Load user profile
        const profile = await notificationPersonalizer.analyzeUserPatterns(currentUser!.id);
        setUserProfile(profile);

        // Load scheduled reminders
        const reminders = await notificationService.getScheduledReminders();
        setScheduledReminders(reminders.filter(r => r.content.data?.type === 'task_reminder'));
      }
    } catch (err) {
      console.error('Error initializing smart notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize smart notifications');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<PersonalizationSettings>) => {
    if (!currentUser?.id || !settings) return;

    try {
      setError(null);
      const updatedSettings = { ...settings, ...newSettings };
      
      await notificationPersonalizer.updateUserSettings(currentUser.id, updatedSettings);
      setSettings(updatedSettings);

      // If smart notifications were toggled, update all notifications
      if ('isSmartEnabled' in newSettings) {
        await updateAllSmartNotifications();
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, [currentUser?.id, settings]);

  const scheduleSmartReminder = useCallback(async (
    task: Task,
    timing: NotificationTiming,
    options: { triggerType?: 'daily' | 'weekly' | 'custom'; customMessage?: string; } = {}
  ): Promise<string | null> => {
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const notificationId = await taskCompletionActions.scheduleSmartNotification(
        task,
        currentUser.id,
        timing,
        options
      );

      // Refresh scheduled reminders
      const reminders = await notificationService.getScheduledReminders();
      setScheduledReminders(reminders.filter(r => r.content.data?.type === 'task_reminder'));

      return notificationId;
    } catch (err) {
      console.error('Error scheduling smart reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule reminder');
      throw err;
    }
  }, [currentUser?.id]);

  const updateAllSmartNotifications = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setError(null);
      await taskCompletionActions.updateSmartNotifications(currentUser.id);
      
      // Refresh scheduled reminders
      const reminders = await notificationService.getScheduledReminders();
      setScheduledReminders(reminders.filter(r => r.content.data?.type === 'task_reminder'));
    } catch (err) {
      console.error('Error updating smart notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to update notifications');
      throw err;
    }
  }, [currentUser?.id]);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const perms = await notificationService.requestPermissions();
      setHasPermissions(perms);
      return perms;
    } catch (err) {
      console.error('Error checking permissions:', err);
      setHasPermissions(false);
      return false;
    }
  }, []);

  const analyzeUserPatterns = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setError(null);
      const profile = await notificationPersonalizer.analyzeUserPatterns(currentUser.id);
      setUserProfile(profile);
    } catch (err) {
      console.error('Error analyzing user patterns:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze patterns');
      throw err;
    }
  }, [currentUser?.id]);

  return {
    settings,
    loading,
    error,
    hasPermissions,
    updateSettings,
    scheduleSmartReminder,
    updateAllSmartNotifications,
    checkPermissions,
    analyzeUserPatterns,
    userProfile,
    scheduledReminders,
  };
};

export default useSmartNotifications;