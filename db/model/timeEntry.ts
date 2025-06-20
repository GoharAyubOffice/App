import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class TimeEntry extends Model {
  static table = 'time_entries';

  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
    profiles: { type: 'belongs_to', key: 'user_id' },
  };

  @field('server_id') serverId!: string;
  @field('task_id') taskId!: string;
  @field('user_id') userId!: string;
  @field('description') description!: string;
  @field('duration') duration!: number;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('tasks', 'task_id') task!: any;
  @relation('profiles', 'user_id') user!: any;
}