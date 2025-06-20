import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';

import { schema } from './schema';
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

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'FlowStateApp',
  migrationEvents: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
  experimentalUseJSI: Platform.OS === 'ios',
});

export const database = new Database({
  adapter,
  modelClasses: [
    Profile,
    Workspace,
    Project,
    Task,
    Subtask,
    Comment,
    Tag,
    TaskTag,
    WorkspaceMember,
    Attachment,
    TimeEntry,
    ActivityLog,
    TaskCompletion,
    UserStreak,
    DailyActivity,
    StreakProtection,
  ],
});

export { Profile, Workspace, Project, Task, Subtask, Comment, Tag, TaskTag, WorkspaceMember, Attachment, TimeEntry, ActivityLog, TaskCompletion, UserStreak, DailyActivity, StreakProtection };