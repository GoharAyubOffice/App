import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../db';
import { TaskCompletion } from '../db/model/taskCompletion';
import { Task } from '../db/model/task';
import { NotificationTiming, notificationService } from './notificationService';
import { Q } from '@nozbe/watermelondb';

// Storage keys for personalization data
const PERSONALIZATION_DATA_KEY = 'notification_personalization';
const USER_PREFERENCES_KEY = 'notification_preferences';

export interface CompletionPattern {
  hour: number;
  dayOfWeek: number;
  completionCount: number;
  successRate: number;
  averageCompletionTime: number; // minutes after notification
}

export interface UserNotificationProfile {
  userId: string;
  mostActiveHours: number[]; // Hours when user is most active
  preferredDays: number[]; // Days when user completes most tasks
  averageResponseTime: number; // Average time between notification and completion
  completionPatterns: CompletionPattern[];
  lastAnalyzed: Date;
  totalCompletions: number;
  notificationEffectiveness: Record<string, number>; // hour -> effectiveness score
}

export interface PersonalizationSettings {
  isSmartEnabled: boolean;
  minHour: number; // Earliest notification time
  maxHour: number; // Latest notification time
  excludedDays: number[]; // Days to not send notifications
  adaptationSensitivity: 'low' | 'medium' | 'high';
  learningEnabled: boolean;
}

export interface OptimizedTiming {
  originalTiming: NotificationTiming;
  optimizedTiming: NotificationTiming;
  confidence: number; // 0-1, how confident we are in this optimization
  reason: string;
  effectivenessScore: number;
}

export class NotificationPersonalizer {
  private static instance: NotificationPersonalizer;

  static getInstance(): NotificationPersonalizer {
    if (!NotificationPersonalizer.instance) {
      NotificationPersonalizer.instance = new NotificationPersonalizer();
    }
    return NotificationPersonalizer.instance;
  }

  /**
   * Analyze user's completion patterns and update their profile
   */
  async analyzeUserPatterns(userId: string): Promise<UserNotificationProfile> {
    try {
      console.log(`[NotificationPersonalizer] Analyzing patterns for user: ${userId}`);

      // Get completion data from the last 60 days
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 60);

      const completions = await database.collections
        .get<TaskCompletion>('task_completions')
        .query(
          Q.where('completed_by', userId),
          Q.where('completed_at', Q.gte(sinceDate.getTime()))
        )
        .fetch();

      if (completions.length === 0) {
        return this.createDefaultProfile(userId);
      }

      // Analyze completion patterns
      const patterns = this.extractCompletionPatterns(completions);
      const mostActiveHours = this.findMostActiveHours(completions);
      const preferredDays = this.findPreferredDays(completions);
      const averageResponseTime = this.calculateAverageResponseTime(completions);
      const notificationEffectiveness = this.calculateNotificationEffectiveness(completions);

      const profile: UserNotificationProfile = {
        userId,
        mostActiveHours,
        preferredDays,
        averageResponseTime,
        completionPatterns: patterns,
        lastAnalyzed: new Date(),
        totalCompletions: completions.length,
        notificationEffectiveness,
      };

      // Save profile
      await this.saveUserProfile(profile);
      
      console.log(`[NotificationPersonalizer] Profile updated for user ${userId}:`, {
        mostActiveHours,
        preferredDays,
        totalCompletions: completions.length,
      });

      return profile;
    } catch (error) {
      console.error('[NotificationPersonalizer] Error analyzing user patterns:', error);
      return this.createDefaultProfile(userId);
    }
  }

  /**
   * Get optimized notification timing for a task
   */
  async getOptimizedTiming(
    userId: string,
    task: Task,
    originalTiming: NotificationTiming
  ): Promise<OptimizedTiming> {
    try {
      const profile = await this.getUserProfile(userId);
      const settings = await this.getUserSettings(userId);

      if (!settings.isSmartEnabled || !settings.learningEnabled) {
        return {
          originalTiming,
          optimizedTiming: originalTiming,
          confidence: 0,
          reason: 'Smart learning disabled by user',
          effectivenessScore: 0.5,
        };
      }

      // Find the best time based on user patterns
      const optimizedHour = this.findOptimalHour(profile, originalTiming, settings);
      const optimizedMinute = this.findOptimalMinute(profile, originalTiming);

      const optimizedTiming: NotificationTiming = {
        hour: optimizedHour,
        minute: optimizedMinute,
        dayOfWeek: originalTiming.dayOfWeek,
      };

      const confidence = this.calculateConfidence(profile, optimizedTiming);
      const effectivenessScore = profile.notificationEffectiveness[optimizedHour.toString()] || 0.5;
      const reason = this.generateOptimizationReason(originalTiming, optimizedTiming, profile);

      console.log(`[NotificationPersonalizer] Optimized timing for task "${task.title}":`, {
        original: `${originalTiming.hour}:${originalTiming.minute}`,
        optimized: `${optimizedTiming.hour}:${optimizedTiming.minute}`,
        confidence,
        reason,
      });

      return {
        originalTiming,
        optimizedTiming,
        confidence,
        reason,
        effectivenessScore,
      };
    } catch (error) {
      console.error('[NotificationPersonalizer] Error optimizing timing:', error);
      return {
        originalTiming,
        optimizedTiming: originalTiming,
        confidence: 0,
        reason: 'Error during optimization',
        effectivenessScore: 0.5,
      };
    }
  }

  /**
   * Record notification interaction for learning
   */
  async recordNotificationInteraction(
    userId: string,
    notificationId: string,
    taskId: string,
    interactionType: 'completed' | 'dismissed' | 'snoozed',
    timeBetweenNotificationAndAction: number // minutes
  ): Promise<void> {
    try {
      const interaction = {
        notificationId,
        taskId,
        userId,
        interactionType,
        timeBetweenNotificationAndAction,
        timestamp: new Date().toISOString(),
      };

      // Store interaction data for future analysis
      const storageKey = `notification_interaction_${userId}_${Date.now()}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(interaction));

      // If task was completed, trigger pattern re-analysis
      if (interactionType === 'completed') {
        await this.analyzeUserPatterns(userId);
      }

      console.log(`[NotificationPersonalizer] Recorded ${interactionType} interaction for user ${userId}`);
    } catch (error) {
      console.error('[NotificationPersonalizer] Error recording interaction:', error);
    }
  }

  /**
   * Get user's personalization settings
   */
  async getUserSettings(userId: string): Promise<PersonalizationSettings> {
    try {
      const settingsData = await AsyncStorage.getItem(`${USER_PREFERENCES_KEY}_${userId}`);
      
      if (settingsData) {
        return JSON.parse(settingsData);
      }

      // Default settings
      const defaultSettings: PersonalizationSettings = {
        isSmartEnabled: true,
        minHour: 8, // 8 AM
        maxHour: 22, // 10 PM
        excludedDays: [], // No excluded days by default
        adaptationSensitivity: 'medium',
        learningEnabled: true,
      };

      await this.saveUserSettings(userId, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('[NotificationPersonalizer] Error getting user settings:', error);
      return {
        isSmartEnabled: false,
        minHour: 8,
        maxHour: 22,
        excludedDays: [],
        adaptationSensitivity: 'medium',
        learningEnabled: false,
      };
    }
  }

  /**
   * Update user's personalization settings
   */
  async updateUserSettings(userId: string, settings: Partial<PersonalizationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };
      await this.saveUserSettings(userId, updatedSettings);
      
      console.log(`[NotificationPersonalizer] Updated settings for user ${userId}:`, updatedSettings);
    } catch (error) {
      console.error('[NotificationPersonalizer] Error updating user settings:', error);
    }
  }

  /**
   * Extract completion patterns from historical data
   */
  private extractCompletionPatterns(completions: TaskCompletion[]): CompletionPattern[] {
    const patterns: Record<string, CompletionPattern> = {};

    completions.forEach(completion => {
      const completedAt = new Date(completion.completedAt);
      const hour = completedAt.getHours();
      const dayOfWeek = completedAt.getDay();
      const key = `${hour}_${dayOfWeek}`;

      if (!patterns[key]) {
        patterns[key] = {
          hour,
          dayOfWeek,
          completionCount: 0,
          successRate: 0,
          averageCompletionTime: 0,
        };
      }

      patterns[key].completionCount++;
    });

    // Calculate success rates and average completion times
    Object.values(patterns).forEach(pattern => {
      pattern.successRate = pattern.completionCount / completions.length;
      // For now, assume average completion time is consistent
      pattern.averageCompletionTime = 15; // 15 minutes average
    });

    return Object.values(patterns).sort((a, b) => b.completionCount - a.completionCount);
  }

  /**
   * Find the hours when user is most active
   */
  private findMostActiveHours(completions: TaskCompletion[]): number[] {
    const hourCounts: Record<number, number> = {};

    completions.forEach(completion => {
      const hour = new Date(completion.completedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) // Top 3 hours
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Find preferred days of the week
   */
  private findPreferredDays(completions: TaskCompletion[]): number[] {
    const dayCounts: Record<number, number> = {};

    completions.forEach(completion => {
      const dayOfWeek = new Date(completion.completedAt).getDay();
      dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4) // Top 4 days
      .map(([day]) => parseInt(day));
  }

  /**
   * Calculate average response time to notifications
   */
  private calculateAverageResponseTime(completions: TaskCompletion[]): number {
    // For now, return a default value
    // In a real implementation, we'd track time between notification and completion
    return 30; // 30 minutes average
  }

  /**
   * Calculate notification effectiveness by hour
   */
  private calculateNotificationEffectiveness(completions: TaskCompletion[]): Record<string, number> {
    const hourEffectiveness: Record<string, number> = {};
    const hourCounts: Record<string, number> = {};

    completions.forEach(completion => {
      const hour = new Date(completion.completedAt).getHours();
      const hourStr = hour.toString();
      
      hourCounts[hourStr] = (hourCounts[hourStr] || 0) + 1;
    });

    // Calculate effectiveness scores (0-1) based on completion frequency
    const maxCount = Math.max(...Object.values(hourCounts));
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString();
      const count = hourCounts[hourStr] || 0;
      hourEffectiveness[hourStr] = maxCount > 0 ? count / maxCount : 0.5;
    }

    return hourEffectiveness;
  }

  /**
   * Find optimal hour based on user patterns
   */
  private findOptimalHour(
    profile: UserNotificationProfile,
    originalTiming: NotificationTiming,
    settings: PersonalizationSettings
  ): number {
    const { originalHour } = { originalHour: originalTiming.hour };
    
    // If not enough data, stick close to original
    if (profile.totalCompletions < 10) {
      return originalHour;
    }

    // Find the most effective hour within constraints
    const candidateHours = profile.mostActiveHours.filter(
      hour => hour >= settings.minHour && hour <= settings.maxHour
    );

    if (candidateHours.length === 0) {
      return Math.max(settings.minHour, Math.min(settings.maxHour, originalHour));
    }

    // Choose based on adaptation sensitivity
    switch (settings.adaptationSensitivity) {
      case 'low':
        // Stay close to original time
        return candidateHours.find(hour => Math.abs(hour - originalHour) <= 1) || candidateHours[0];
      
      case 'high':
        // Use the most effective hour
        return candidateHours[0];
      
      case 'medium':
      default:
        // Balance between original and most effective
        const closeHours = candidateHours.filter(hour => Math.abs(hour - originalHour) <= 2);
        return closeHours.length > 0 ? closeHours[0] : candidateHours[0];
    }
  }

  /**
   * Find optimal minute based on patterns
   */
  private findOptimalMinute(profile: UserNotificationProfile, originalTiming: NotificationTiming): number {
    // For now, keep minutes simple - round to nearest 15-minute interval
    const originalMinute = originalTiming.minute;
    const intervals = [0, 15, 30, 45];
    
    return intervals.reduce((prev, curr) => 
      Math.abs(curr - originalMinute) < Math.abs(prev - originalMinute) ? curr : prev
    );
  }

  /**
   * Calculate confidence in the optimization
   */
  private calculateConfidence(profile: UserNotificationProfile, timing: NotificationTiming): number {
    const { totalCompletions, notificationEffectiveness } = profile;
    
    // More data = higher confidence
    const dataConfidence = Math.min(totalCompletions / 50, 1); // Max confidence at 50+ completions
    
    // Higher effectiveness = higher confidence
    const effectivenessConfidence = notificationEffectiveness[timing.hour.toString()] || 0.5;
    
    return (dataConfidence + effectivenessConfidence) / 2;
  }

  /**
   * Generate human-readable optimization reason
   */
  private generateOptimizationReason(
    original: NotificationTiming,
    optimized: NotificationTiming,
    profile: UserNotificationProfile
  ): string {
    if (original.hour === optimized.hour) {
      return 'Timing already optimal based on your patterns';
    }

    const timeDiff = Math.abs(optimized.hour - original.hour);
    const direction = optimized.hour > original.hour ? 'later' : 'earlier';
    
    if (timeDiff === 1) {
      return `Moved 1 hour ${direction} based on your completion patterns`;
    } else if (timeDiff <= 3) {
      return `Adjusted to ${timeDiff} hours ${direction} when you're most active`;
    } else {
      return `Optimized to your peak productivity time (${optimized.hour}:00)`;
    }
  }

  /**
   * Create default profile for new users
   */
  private createDefaultProfile(userId: string): UserNotificationProfile {
    return {
      userId,
      mostActiveHours: [9, 14, 19], // 9 AM, 2 PM, 7 PM
      preferredDays: [1, 2, 3, 4, 5], // Monday to Friday
      averageResponseTime: 30,
      completionPatterns: [],
      lastAnalyzed: new Date(),
      totalCompletions: 0,
      notificationEffectiveness: {},
    };
  }

  /**
   * Get user profile from storage
   */
  private async getUserProfile(userId: string): Promise<UserNotificationProfile> {
    try {
      const profileData = await AsyncStorage.getItem(`${PERSONALIZATION_DATA_KEY}_${userId}`);
      
      if (profileData) {
        const profile = JSON.parse(profileData);
        
        // If profile is more than 7 days old, re-analyze
        const lastAnalyzed = new Date(profile.lastAnalyzed);
        const daysSinceAnalysis = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceAnalysis > 7) {
          return await this.analyzeUserPatterns(userId);
        }
        
        return profile;
      }

      return await this.analyzeUserPatterns(userId);
    } catch (error) {
      console.error('[NotificationPersonalizer] Error getting user profile:', error);
      return this.createDefaultProfile(userId);
    }
  }

  /**
   * Save user profile to storage
   */
  private async saveUserProfile(profile: UserNotificationProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${PERSONALIZATION_DATA_KEY}_${profile.userId}`,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error('[NotificationPersonalizer] Error saving user profile:', error);
    }
  }

  /**
   * Save user settings to storage
   */
  private async saveUserSettings(userId: string, settings: PersonalizationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${USER_PREFERENCES_KEY}_${userId}`,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('[NotificationPersonalizer] Error saving user settings:', error);
    }
  }
}

// Export singleton instance
export const notificationPersonalizer = NotificationPersonalizer.getInstance();