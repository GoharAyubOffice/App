import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class TaskTag extends Model {
  static table = 'task_tags';

  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
    tags: { type: 'belongs_to', key: 'tag_id' },
  };

  @field('task_id') taskId!: string;
  @field('tag_id') tagId!: string;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('tasks', 'task_id') task!: any;
  @relation('tags', 'tag_id') tag!: any;
}