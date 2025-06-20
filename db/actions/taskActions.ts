import { database } from '../index';
import { Task, TaskStatus, TaskPriority } from '../model/task';
import { Project } from '../model/project';
import { Q } from '@nozbe/watermelondb';

export interface TaskData {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  createdBy: string;
  dueDate?: Date;
  position?: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  searchQuery?: string;
}

export class TaskActions {
  static async createTask(taskData: TaskData): Promise<Task> {
    return await database.write(async () => {
      const tasksCollection = database.get<Task>('tasks');
      
      // Get position for new task (last position in project + 1)
      const projectTasks = await tasksCollection
        .query(Q.where('project_id', taskData.projectId))
        .fetch();
      
      const maxPosition = Math.max(...projectTasks.map(t => (t as any).position), 0);
      
      return await tasksCollection.create((task: any) => {
        task.serverId = taskData.id || '';
        task.title = taskData.title;
        task.description = taskData.description || '';
        task.status = taskData.status;
        task.priority = taskData.priority;
        task.projectId = taskData.projectId;
        task.assigneeId = taskData.assigneeId || '';
        task.createdBy = taskData.createdBy;
        task.dueDate = taskData.dueDate?.getTime() || null;
        task.position = taskData.position || (maxPosition + 1);
        task.createdAt = Date.now();
        task.updatedAt = Date.now();
        task.isDirty = true;
      });
    });
  }

  static async updateTask(taskId: string, updates: Partial<TaskData>): Promise<Task | null> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      const task = await tasksCollection.find(taskId);
      
      return await database.write(async () => {
        return await task.update((record: any) => {
          if (updates.title !== undefined) record.title = updates.title;
          if (updates.description !== undefined) record.description = updates.description;
          if (updates.status !== undefined) record.status = updates.status;
          if (updates.priority !== undefined) record.priority = updates.priority;
          if (updates.projectId !== undefined) record.projectId = updates.projectId;
          if (updates.assigneeId !== undefined) record.assigneeId = updates.assigneeId;
          if (updates.dueDate !== undefined) record.dueDate = updates.dueDate?.getTime() || null;
          if (updates.position !== undefined) record.position = updates.position;
          
          record.updatedAt = Date.now();
          record.isDirty = true;
          
          // Set completed_at when status changes to completed
          if (updates.status === 'completed' && record.status !== 'completed') {
            record.completedAt = Date.now();
          } else if (updates.status !== 'completed' && record.status === 'completed') {
            record.completedAt = null;
          }
        });
      });
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      const task = await tasksCollection.find(taskId);
      
      await database.write(async () => {
        await task.markAsDeleted();
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      return await tasksCollection.find(taskId);
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      return null;
    }
  }

  static async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      return await tasksCollection
        .query(Q.where('project_id', projectId), Q.sortBy('position'))
        .fetch();
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      return [];
    }
  }

  static async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      return await tasksCollection
        .query(Q.where('assignee_id', assigneeId), Q.sortBy('created_at', Q.desc))
        .fetch();
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      return [];
    }
  }

  static async searchTasks(filters: TaskFilters = {}): Promise<Task[]> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      const conditions = [];

      if (filters.status) {
        conditions.push(Q.where('status', filters.status));
      }

      if (filters.priority) {
        conditions.push(Q.where('priority', filters.priority));
      }

      if (filters.projectId) {
        conditions.push(Q.where('project_id', filters.projectId));
      }

      if (filters.assigneeId) {
        conditions.push(Q.where('assignee_id', filters.assigneeId));
      }

      if (filters.dueDateFrom) {
        conditions.push(Q.where('due_date', Q.gte(filters.dueDateFrom.getTime())));
      }

      if (filters.dueDateTo) {
        conditions.push(Q.where('due_date', Q.lte(filters.dueDateTo.getTime())));
      }

      if (filters.searchQuery) {
        conditions.push(
          Q.or(
            Q.where('title', Q.like(`%${Q.sanitizeLikeString(filters.searchQuery)}%`)),
            Q.where('description', Q.like(`%${Q.sanitizeLikeString(filters.searchQuery)}%`))
          )
        );
      }

      return await tasksCollection
        .query(...conditions, Q.sortBy('created_at', Q.desc))
        .fetch();
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  static async getOverdueTasks(): Promise<Task[]> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      const now = Date.now();
      
      return await tasksCollection
        .query(
          Q.where('status', Q.notEq('completed')),
          Q.where('due_date', Q.lt(now)),
          Q.where('due_date', Q.notEq(null))
        )
        .fetch();
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      return [];
    }
  }

  static async getTasksDueToday(): Promise<Task[]> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      return await tasksCollection
        .query(
          Q.where('status', Q.notEq('completed')),
          Q.where('due_date', Q.gte(startOfDay.getTime())),
          Q.where('due_date', Q.lte(endOfDay.getTime()))
        )
        .fetch();
    } catch (error) {
      console.error('Error fetching tasks due today:', error);
      return [];
    }
  }

  static async getTaskStats(projectId?: string): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const tasksCollection = database.get<Task>('tasks');
      const conditions = projectId ? [Q.where('project_id', projectId)] : [];
      
      const tasks = await tasksCollection.query(...conditions).fetch();
      
      return {
        total: tasks.length,
        todo: tasks.filter(t => (t as any).status === 'todo').length,
        inProgress: tasks.filter(t => (t as any).status === 'in_progress').length,
        completed: tasks.filter(t => (t as any).status === 'completed').length,
        cancelled: tasks.filter(t => (t as any).status === 'cancelled').length,
      };
    } catch (error) {
      console.error('Error getting task stats:', error);
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
      };
    }
  }

  static async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
    return this.updateTask(taskId, { status });
  }

  static async updateTaskPriority(taskId: string, priority: TaskPriority): Promise<Task | null> {
    return this.updateTask(taskId, { priority });
  }

  static async moveTask(taskId: string, newProjectId: string, newPosition?: number): Promise<Task | null> {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) return null;

      // If no position specified, put at end of target project
      let targetPosition = newPosition;
      if (!targetPosition) {
        const projectTasks = await this.getTasksByProject(newProjectId);
        targetPosition = Math.max(...projectTasks.map(t => (t as any).position), 0) + 1;
      }

      return this.updateTask(taskId, {
        projectId: newProjectId,
        position: targetPosition,
      });
    } catch (error) {
      console.error('Error moving task:', error);
      return null;
    }
  }

  static async duplicateTask(taskId: string): Promise<Task | null> {
    try {
      const originalTask = await this.getTaskById(taskId);
      if (!originalTask) return null;

      const taskData = originalTask as any;
      
      return this.createTask({
        title: `${taskData.title} (Copy)`,
        description: taskData.description,
        status: 'todo',
        priority: taskData.priority,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId,
        createdBy: taskData.createdBy,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      });
    } catch (error) {
      console.error('Error duplicating task:', error);
      return null;
    }
  }

  static async validateTaskData(data: Partial<TaskData>): Promise<{
    isValid: boolean;
    errors: { [key: string]: string };
  }> {
    const errors: { [key: string]: string } = {};

    // Validate title
    if (data.title !== undefined) {
      if (!data.title.trim()) {
        errors.title = 'Task title is required';
      } else if (data.title.trim().length > 200) {
        errors.title = 'Task title must be less than 200 characters';
      }
    }

    // Validate description
    if (data.description !== undefined && data.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }

    // Validate status
    if (data.status !== undefined) {
      const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(data.status)) {
        errors.status = 'Invalid task status';
      }
    }

    // Validate priority
    if (data.priority !== undefined) {
      const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(data.priority)) {
        errors.priority = 'Invalid task priority';
      }
    }

    // Validate projectId
    if (data.projectId !== undefined && !data.projectId.trim()) {
      errors.projectId = 'Project is required';
    }

    // Validate due date
    if (data.dueDate !== undefined && data.dueDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (data.dueDate < now) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static async getAvailableProjects(): Promise<Project[]> {
    try {
      const projectsCollection = database.get<Project>('projects');
      return await projectsCollection
        .query(Q.where('is_archived', false), Q.sortBy('name'))
        .fetch();
    } catch (error) {
      console.error('Error fetching available projects:', error);
      return [];
    }
  }
}

export default TaskActions;