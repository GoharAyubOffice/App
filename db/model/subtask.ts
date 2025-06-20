import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Subtask extends Model {
  static table = 'subtasks';

  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
  };

  @field('server_id') serverId!: string;
  @field('title') title!: string;
  @field('description') description!: string;
  @field('is_completed') isCompleted!: boolean;
  @field('task_id') taskId!: string;
  @field('position') position!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('tasks', 'task_id') task!: any;
}