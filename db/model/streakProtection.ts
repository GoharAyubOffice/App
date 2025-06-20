import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class StreakProtection extends Model {
  static table = 'streak_protections';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' },
    user_streaks: { type: 'belongs_to', key: 'streak_id' },
    tasks: { type: 'belongs_to', key: 'task_id' },
  };

  @field('server_id') serverId!: string;
  @field('user_id') userId!: string;
  @field('streak_id') streakId!: string;
  @field('task_id') taskId?: string; // Optional, for task-specific protections
  @date('protection_date') protectionDate!: Date; // Date when protection was applied
  @field('protection_type') protectionType!: string; // 'auto', 'manual', 'premium'
  @field('reason') reason!: string; // Reason for protection
  @field('available_protections') availableProtections!: number; // Remaining protections
  @field('used_protections') usedProtections!: number; // Total used this period
  @field('metadata') metadata!: string; // JSON string for additional data
  @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt?: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('profiles', 'user_id') user!: any;
  @relation('user_streaks', 'streak_id') streak!: any;
  @relation('tasks', 'task_id') task!: any;
}