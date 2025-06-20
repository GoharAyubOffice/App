import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class TaskCompletion extends Model {
  static table = 'task_completions';

  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
    profiles: { type: 'belongs_to', key: 'completed_by' },
  };

  @field('server_id') serverId!: string;
  @field('task_id') taskId!: string;
  @field('completed_by') completedBy!: string;
  @date('completed_at') completedAt!: Date;
  @field('completion_type') completionType!: string; // 'manual', 'automatic', 'habit'
  @field('notes') notes!: string;
  @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('tasks', 'task_id') task!: any;
  @relation('profiles', 'completed_by') completedByUser!: any;
}