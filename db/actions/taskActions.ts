import { Task, TaskStatus, TaskPriority } from '../model/task';
import { Project } from '../model/project';
import { mockStorage } from '../../store/mockStorage';

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
    // Use mock storage for Expo Go
    const newTask = mockStorage.addTask({
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status,
      priority: taskData.priority,
      projectId: taskData.projectId,
      assigneeId: taskData.assigneeId || '',
      createdBy: taskData.createdBy,
      dueDate: taskData.dueDate || null,
    });

    // Return task in expected format
    return newTask as any;
  }

  static async updateTask(taskId: string, updates: Partial<TaskData>): Promise<Task | null> {
    try {
      const updatedTask = mockStorage.updateTask(taskId, updates as any);
      return updatedTask as any;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      return mockStorage.deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const tasks = mockStorage.getTasks();
      const task = tasks.find(t => t.id === taskId);
      return task as any || null;
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      return null;
    }
  }

  static async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const tasks = mockStorage.getTasks();
      return tasks.filter(t => t.projectId === projectId) as any[];
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      return [];
    }
  }

  static async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const tasks = mockStorage.getTasks(assigneeId);
      return tasks as any[];
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      return [];
    }
  }

  static async getTodayTasks(userId: string): Promise<Task[]> {
    try {
      const tasks = mockStorage.getTodayTasks(userId);
      console.log('Getting today tasks for user:', userId, 'Found:', tasks.length);
      return tasks as any[];
    } catch (error) {
      console.error('Error fetching today tasks:', error);
      return [];
    }
  }

  static async searchTasks(filters: TaskFilters = {}): Promise<Task[]> {
    try {
      let tasks = mockStorage.getTasks(filters.assigneeId);

      // Apply filters
      if (filters.status) {
        tasks = tasks.filter(t => t.status === filters.status);
      }

      if (filters.priority) {
        tasks = tasks.filter(t => t.priority === filters.priority);
      }

      if (filters.projectId) {
        tasks = tasks.filter(t => t.projectId === filters.projectId);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        tasks = tasks.filter(t => 
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
        );
      }

      return tasks as any[];
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  static async getAvailableProjects(): Promise<Project[]> {
    // Return empty array since we're not using projects
    return [];
  }

  static async toggleTaskStatus(taskId: string): Promise<Task | null> {
    try {
      const tasks = mockStorage.getTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) return null;

      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      return await this.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Error toggling task status:', error);
      return null;
    }
  }
}