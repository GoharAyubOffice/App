// Temporarily disabled WatermelonDB for Expo Go testing
// import { Database } from '@nozbe/watermelondb';
// import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';

// import { schema } from './schema';
import { Profile } from './model/profile';
import { Workspace } from './model/workspace';
import { Project } from './model/project';
import { Task } from './model/task';
import { Subtask } from './model/subtask';
import { Comment } from './model/comment';
import { Tag } from './model/tag';
import { TaskTag } from './model/taskTag';
import { WorkspaceMember } from './model/workspaceMember';
import { Attachment } from './model/attachment';
import { TimeEntry } from './model/timeEntry';
import { ActivityLog } from './model/activityLog';
import { TaskCompletion } from './model/taskCompletion';
import { UserStreak } from './model/userStreak';
import { DailyActivity } from './model/dailyActivity';
import { StreakProtection } from './model/streakProtection';
import { MoodEntry } from './model/moodEntry';

// Mock database for Expo Go testing
export const database = {
  get: (tableName: string) => ({
    query: () => ({
      fetch: async () => [],
      observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    create: async () => ({
      id: Math.random().toString(36).substr(2, 9),
      _raw: {},
    }),
    find: async () => ({
      id: Math.random().toString(36).substr(2, 9),
      _raw: {},
    }),
  }),
  collections: {
    get: (tableName: string) => ({
      query: () => ({
        fetch: async () => [],
        observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      }),
      create: async () => ({
        id: Math.random().toString(36).substr(2, 9),
        _raw: {},
      }),
      find: async () => ({
        id: Math.random().toString(36).substr(2, 9),
        _raw: {},
      }),
    }),
  },
  write: async (fn: Function) => fn(),
  read: async (fn: Function) => fn(),
  action: async (fn: Function) => fn(),
} as any;

export { Profile, Workspace, Project, Task, Subtask, Comment, Tag, TaskTag, WorkspaceMember, Attachment, TimeEntry, ActivityLog, TaskCompletion, UserStreak, DailyActivity, StreakProtection, MoodEntry };