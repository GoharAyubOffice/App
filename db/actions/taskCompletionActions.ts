import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Task } from '../model/task';
import { TaskCompletion } from '../model/taskCompletion';
import { notificationPersonalizer } from '../../services/notificationPersonalizer';
import { notificationService } from '../../services/notificationService';

export interface TaskCompletionActionResult {
  success: boolean;
  task?: Task;
  completion?: TaskCompletion;
  error?: string;
}

export const taskCompletionActions = {
  /**
   * Toggle task completion status with optimistic update
   * Creates a TaskCompletion record when completing a task
   */
  toggleTaskCompletion: async (
    task: Task,
    userId: string,
    completionType: 'manual' | 'automatic' | 'habit' = 'manual',
    notes?: string
  ): Promise<TaskCompletionActionResult> => {
    try {
      const isCompleting = task.status !== 'completed';

      return await database.write(async () => {
        // Update the task
        await task.update((record: any) => {
          record.status = isCompleting ? 'completed' : 'todo';
          record.completedAt = isCompleting ? new Date() : null;
          record.updatedAt = new Date();
          record.isDirty = true;
        });

        let completion: TaskCompletion | undefined;

        if (isCompleting) {
          // Create completion record
          completion = await database.collections
            .get<TaskCompletion>('task_completions')
            .create((record: any) => {
              record.taskId = task.id;
              record.completedBy = userId;
              record.completedAt = new Date();
              record.completionType = completionType;
              record.notes = notes || '';
              record.createdAt = new Date();
              record.isDirty = true;
            });
        } else {
          // Remove completion record if uncompleting
          const existingCompletion = await database.collections
            .get<TaskCompletion>('task_completions')
            .query(
              Q.where('task_id', task.id)
            )
            .fetch();

          if (existingCompletion.length > 0) {
            await existingCompletion[0].markAsDeleted();
          }
        }

        // Trigger personalization learning if task was completed
        if (isCompleting && completion) {
          // Use taskCompletionActions instead of this to avoid 'this' context issues
          taskCompletionActions.triggerPersonalizationLearning(task, userId, completion).catch((error: unknown) => {
            console.error('Error triggering personalization learning:', error);
          });
        }

        return {
          success: true,
          task,
          completion,
        };
      });
    } catch (error: any) {
      console.error('Error toggling task completion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Complete a task with additional metadata
   */
  completeTask: async (
    task: Task,
    userId: string,
    completionType: 'manual' | 'automatic' | 'habit' = 'manual',
    notes?: string
  ): Promise<TaskCompletionActionResult> => {
    try {
      if (task.status === 'completed') {
        return {
          success: false,
          error: 'Task is already completed',
        };
      }

      return await database.write(async () => {
        // Update the task
        await task.update((record: any) => {
          record.status = 'completed';
          record.completedAt = new Date();
          record.updatedAt = new Date();
          record.isDirty = true;
        });

        // Create completion record
        const completion = await database.collections
          .get<TaskCompletion>('task_completions')
          .create((record: any) => {
            record.taskId = task.id;
            record.completedBy = userId;
            record.completedAt = new Date();
            record.completionType = completionType;
            record.notes = notes || '';
            record.createdAt = new Date();
            record.isDirty = true;
          });

        // Trigger personalization learning
        taskCompletionActions.triggerPersonalizationLearning(task, userId, completion).catch((error: unknown) => {
          console.error('Error triggering personalization learning:', error);
        });

        return {
          success: true,
          task,
          completion,
        };
      });
    } catch (error: any) {
      console.error('Error completing task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Uncomplete a task (mark as todo)
   */
  uncompleteTask: async (task: Task): Promise<TaskCompletionActionResult> => {
    try {
      if (task.status !== 'completed') {
        return {
          success: false,
          error: 'Task is not completed',
        };
      }

      return await database.write(async () => {
        // Update the task
        await task.update((record: any) => {
          record.status = 'todo';
          record.completedAt = null;
          record.updatedAt = new Date();
          record.isDirty = true;
        });

        // Remove completion record
        const existingCompletion = await database.collections
          .get<TaskCompletion>('task_completions')
          .query(
            Q.where('task_id', task.id)
          )
          .fetch();

        if (existingCompletion.length > 0) {
          await existingCompletion[0].markAsDeleted();
        }

        return {
          success: true,
          task,
        };
      });
    } catch (error: any) {
      console.error('Error uncompleting task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Get task completion record
   */
  getTaskCompletion: async (taskId: string): Promise<TaskCompletion | null> => {
    try {
      const completions = await database.collections
        .get<TaskCompletion>('task_completions')
        .query(
          Q.where('task_id', taskId)
        )
        .fetch();

      return completions.length > 0 ? completions[0] : null;
    } catch (error) {
      console.error('Error fetching task completion:', error);
      return null;
    }
  },

  /**
   * Get user's completion statistics
   */
  getUserCompletionStats: async (userId: string, days: number = 30): Promise<{
    totalCompletions: number;
    completionsByType: Record<string, number>;
    averagePerDay: number;
  }> => {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const completions = await database.collections
        .get<TaskCompletion>('task_completions')
        .query(
          Q.where('completed_by', userId),
          Q.where('completed_at', Q.gte(sinceDate.getTime()))
        )
        .fetch();

      const completionsByType: Record<string, number> = {};
      completions.forEach((completion: TaskCompletion) => {
        completionsByType[completion.completionType] =
          (completionsByType[completion.completionType] || 0) + 1;
      });

      return {
        totalCompletions: completions.length,
        completionsByType,
        averagePerDay: completions.length / days,
      };
    } catch (error) {
      console.error('Error fetching user completion stats:', error);
      return {
        totalCompletions: 0,
        completionsByType: {},
        averagePerDay: 0,
      };
    }
  },

  /**
   * Schedule smart notification for a task
   */
  scheduleSmartNotification: async (
    task: Task,
    userId: string,
    originalTiming: { hour: number; minute: number },
    options: {
      triggerType?: 'daily' | 'weekly' | 'custom';
      customMessage?: string;
    } = {}
  ): Promise<string | null> => {
    try {
      const { triggerType = 'daily', customMessage } = options;

      // Get user's personalization settings
      const settings = await notificationPersonalizer.getUserSettings(userId);

      if (!settings.isSmartEnabled) {
        // Use standard notification scheduling
        return await notificationService.scheduleTaskReminder(task, originalTiming, {
          triggerType,
          isSmartEnabled: false,
          customMessage,
        });
      }

      // Get optimized timing
      const optimization = await notificationPersonalizer.getOptimizedTiming(
        userId,
        task,
        originalTiming
      );

      console.log(`[TaskCompletion] Smart notification scheduled for "${task.title}":`, {
        original: `${originalTiming.hour}:${originalTiming.minute}`,
        optimized: `${optimization.optimizedTiming.hour}:${optimization.optimizedTiming.minute}`,
        confidence: optimization.confidence,
        reason: optimization.reason,
      });

      // Schedule with optimized timing
      return await notificationService.scheduleTaskReminder(
        task,
        optimization.optimizedTiming,
        {
          triggerType,
          isSmartEnabled: true,
          customMessage: customMessage || taskCompletionActions.generateSmartNotificationMessage(task, optimization),
        }
      );
    } catch (error) {
      console.error('Error scheduling smart notification:', error);

      // Fallback to standard notification
      return await notificationService.scheduleTaskReminder(task, originalTiming, options);
    }
  },

  /**
   * Update notification timing based on user patterns
   */
  updateSmartNotifications: async (userId: string): Promise<void> => {
    try {
      console.log(`[TaskCompletion] Updating smart notifications for user: ${userId}`);

      // Get all scheduled notifications
      const scheduledNotifications = await notificationService.getScheduledReminders();

      // Filter for smart-enabled task reminders
      const smartNotifications = scheduledNotifications.filter(
        (notification: any) =>
          notification.content?.data?.type === 'task_reminder' &&
          notification.content?.data?.isSmartEnabled === true
      );

      let updatedCount = 0;

      // Update each smart notification
      for (const notification of smartNotifications) {
        try {
          const taskId = notification.content?.data?.taskId as string | undefined;
          if (!taskId) continue;

          // Get the task
          const task = await database.collections.get<Task>('tasks').find(taskId);
          if (!task) continue;

          // Get original timing from notification trigger
          const trigger = notification.trigger;
          let originalTiming = { hour: 9, minute: 0 }; // Default

          // Safely extract hour and minute from trigger if possible (CalendarTriggerInput)
          if (
            trigger &&
            typeof (trigger as any).hour === 'number' &&
            typeof (trigger as any).minute === 'number'
          ) {
            originalTiming = {
              hour: (trigger as any).hour,
              minute: (trigger as any).minute,
            };
          }

          // Get new optimized timing
          const optimization = await notificationPersonalizer.getOptimizedTiming(
            userId,
            task,
            originalTiming
          );

          // Only update if there's significant confidence in the change
          if (
            optimization.confidence > 0.3 &&
            (optimization.optimizedTiming.hour !== originalTiming.hour ||
              optimization.optimizedTiming.minute !== originalTiming.minute)
          ) {
            await notificationService.updateTaskReminder(
              notification.identifier,
              task,
              optimization.optimizedTiming,
              {
                triggerType: (notification.content?.data?.triggerType as 'daily' | 'weekly' | 'custom' | undefined) || 'daily',
                isSmartEnabled: true,
                customMessage: taskCompletionActions.generateSmartNotificationMessage(task, optimization),
              }
            );

            updatedCount++;
          }
        } catch (error) {
          console.error('Error updating individual notification:', error);
        }
      }

      console.log(`[TaskCompletion] Updated ${updatedCount} smart notifications`);
    } catch (error) {
      console.error('Error updating smart notifications:', error);
    }
  },

  /**
   * Trigger personalization learning after task completion
   */
  triggerPersonalizationLearning: async (
    task: Task,
    userId: string,
    completion: TaskCompletion
  ): Promise<void> => {
    try {
      // Re-analyze user patterns with new completion data
      await notificationPersonalizer.analyzeUserPatterns(userId);

      // Update smart notifications based on new patterns
      await taskCompletionActions.updateSmartNotifications(userId);

      console.log(`[TaskCompletion] Triggered personalization learning for user ${userId}`);
    } catch (error) {
      console.error('Error in personalization learning:', error);
    }
  },

  /**
   * Generate smart notification message with personalization info
   */
  generateSmartNotificationMessage: (
    task: Task,
    optimization: { confidence: number; reason: string; effectivenessScore: number }
  ): string => {
    const baseMessage = `Time to work on "${task.title}"`;

    if (optimization && typeof optimization.confidence === 'number') {
      if (optimization.confidence > 0.7) {
        return `${baseMessage} 📈 (Optimized timing)`;
      } else if (optimization.confidence > 0.4) {
        return `${baseMessage} 🎯 (Smart timing)`;
      }
    }

    return baseMessage;
  },
};