import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export class Task extends Model {
  static table = 'tasks';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    profiles: { type: 'belongs_to', key: 'assignee_id' },
    subtasks: { type: 'has_many', foreignKey: 'task_id' },
    comments: { type: 'has_many', foreignKey: 'task_id' },
    attachments: { type: 'has_many', foreignKey: 'task_id' },
    time_entries: { type: 'has_many', foreignKey: 'task_id' },
    task_tags: { type: 'has_many', foreignKey: 'task_id' },
    task_completions: { type: 'has_many', foreignKey: 'task_id' },
  };

  @field('server_id') serverId!: string;
  @field('title') title!: string;
  @field('description') description!: string;
  @field('status') status!: TaskStatus;
  @field('priority') priority!: TaskPriority;
  @field('project_id') projectId!: string;
  @field('assignee_id') assigneeId!: string;
  @field('created_by') createdBy!: string;
  @date('due_date') dueDate?: Date;
  @date('completed_at') completedAt?: Date;
  @field('position') position!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('projects', 'project_id') project!: any;
  @relation('profiles', 'assignee_id') assignee!: any;
  @children('subtasks') subtasks!: any;
  @children('comments') comments!: any;
  @children('attachments') attachments!: any;
  @children('time_entries') timeEntries!: any;
  @children('task_tags') taskTags!: any;
  @children('task_completions') taskCompletions!: any;
}