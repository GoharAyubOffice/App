// Mock storage for Expo Go testing
import { TaskStatus, TaskPriority } from '../db/model/task';
import { MoodLabel } from '../db/model/moodEntry';

export interface MockTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  createdBy: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  position: number;
}

export interface MockMoodEntry {
  id: string;
  userId: string;
  moodScore: number;
  moodLabel: MoodLabel;
  notes: string;
  loggedAt: Date;
  activityContext: string;
  metadata: string;
  createdAt: Date;
  updatedAt: Date;
}

class MockStorage {
  private static instance: MockStorage;
  private tasks: MockTask[] = [];
  private moodEntries: MockMoodEntry[] = [];

  public static getInstance(): MockStorage {
    if (!MockStorage.instance) {
      MockStorage.instance = new MockStorage();
    }
    return MockStorage.instance;
  }

  // Task Methods
  addTask(task: Omit<MockTask, 'id' | 'createdAt' | 'updatedAt' | 'position'>): MockTask {
    const newTask: MockTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      position: this.tasks.length,
    };
    this.tasks.push(newTask);
    console.log('Task added to storage:', newTask);
    return newTask;
  }

  getTasks(userId?: string): MockTask[] {
    const userTasks = userId ? this.tasks.filter(t => t.createdBy === userId) : this.tasks;
    console.log('Getting tasks for user:', userId, 'Found:', userTasks.length);
    return userTasks;
  }

  getTodayTasks(userId: string): MockTask[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userTasks = this.getTasks(userId);
    
    const todayTasks = userTasks.filter(task => {
      // Include tasks without due dates that are todo or in_progress
      if (!task.dueDate) {
        return task.status === 'todo' || task.status === 'in_progress';
      }
      // Include tasks with due date today
      return task.dueDate >= today && task.dueDate < tomorrow;
    });
    
    return todayTasks;
  }

  updateTask(taskId: string, updates: Partial<MockTask>): MockTask | null {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return this.tasks[taskIndex];
  }

  deleteTask(taskId: string): boolean {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return false;

    this.tasks.splice(taskIndex, 1);
    return true;
  }

  // Mood Methods
  addMoodEntry(mood: Omit<MockMoodEntry, 'id' | 'createdAt' | 'updatedAt'>): MockMoodEntry {
    const newMood: MockMoodEntry = {
      ...mood,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.moodEntries.push(newMood);
    console.log('Mood entry added to storage:', newMood);
    return newMood;
  }

  getMoodEntries(userId: string): MockMoodEntry[] {
    return this.moodEntries.filter(m => m.userId === userId);
  }

  getMoodEntryForDate(userId: string, date: Date): MockMoodEntry | null {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.moodEntries.find(m => 
      m.userId === userId && 
      m.loggedAt >= startOfDay && 
      m.loggedAt <= endOfDay
    ) || null;
  }

  getMoodEntriesInRange(userId: string, startDate: Date, endDate: Date): MockMoodEntry[] {
    return this.moodEntries.filter(m => 
      m.userId === userId &&
      m.loggedAt >= startDate &&
      m.loggedAt <= endDate
    );
  }

  updateMoodEntry(moodId: string, updates: Partial<MockMoodEntry>): MockMoodEntry | null {
    const moodIndex = this.moodEntries.findIndex(m => m.id === moodId);
    if (moodIndex === -1) return null;

    this.moodEntries[moodIndex] = {
      ...this.moodEntries[moodIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return this.moodEntries[moodIndex];
  }

  // Utility Methods
  clearAll(): void {
    this.tasks = [];
    this.moodEntries = [];
  }

  getStats(userId: string) {
    const userTasks = this.getTasks(userId);
    const userMoods = this.getMoodEntries(userId);

    return {
      totalTasks: userTasks.length,
      completedTasks: userTasks.filter(t => t.status === 'completed').length,
      totalMoodEntries: userMoods.length,
      averageMood: userMoods.length > 0 
        ? userMoods.reduce((sum, m) => sum + m.moodScore, 0) / userMoods.length 
        : 0,
    };
  }
}

export const mockStorage = MockStorage.getInstance();