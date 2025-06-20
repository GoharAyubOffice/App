import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Comment extends Model {
  static table = 'comments';

  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
    profiles: { type: 'belongs_to', key: 'author_id' },
  };

  @field('server_id') serverId!: string;
  @field('content') content!: string;
  @field('task_id') taskId!: string;
  @field('author_id') authorId!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('tasks', 'task_id') task!: any;
  @relation('profiles', 'author_id') author!: any;
}