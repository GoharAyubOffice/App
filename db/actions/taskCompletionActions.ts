import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Task } from '../model/task';
import { TaskCompletion } from '../model/taskCompletion';

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
        await task.update(record => {
          record.status = isCompleting ? 'completed' : 'todo';
          record.completedAt = isCompleting ? new Date() : undefined;
          record.updatedAt = new Date();
          record.isDirty = true;
        });

        let completion: TaskCompletion | undefined;

        if (isCompleting) {
          // Create completion record
          completion = await database.collections
            .get<TaskCompletion>('task_completions')
            .create(record => {
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

        return {
          success: true,
          task,
          completion,
        };
      });
    } catch (error) {
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
        await task.update(record => {
          record.status = 'completed';
          record.completedAt = new Date();
          record.updatedAt = new Date();
          record.isDirty = true;
        });

        // Create completion record
        const completion = await database.collections
          .get<TaskCompletion>('task_completions')
          .create(record => {
            record.taskId = task.id;
            record.completedBy = userId;
            record.completedAt = new Date();
            record.completionType = completionType;
            record.notes = notes || '';
            record.createdAt = new Date();
            record.isDirty = true;
          });

        return {
          success: true,
          task,
          completion,
        };
      });
    } catch (error) {
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
        await task.update(record => {
          record.status = 'todo';
          record.completedAt = undefined;
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
    } catch (error) {
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
};