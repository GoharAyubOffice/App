import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class UserStreak extends Model {
  static table = 'user_streaks';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' },
  };

  @field('server_id') serverId!: string;
  @field('user_id') userId!: string;
  @field('streak_type') streakType!: string; // 'daily_completion', 'weekly_goal', 'habit_consistency'
  @field('current_count') currentCount!: number;
  @field('longest_count') longestCount!: number;
  @date('last_activity_date') lastActivityDate!: Date;
  @date('streak_start_date') streakStartDate!: Date;
  @field('is_active') isActive!: boolean;
  @field('available_protections') availableProtections!: number; // Streak protections available
  @field('used_protections') usedProtections!: number; // Protections used this month
  @field('protection_reset_date') protectionResetDate!: Date; // When protections reset
  @field('is_protected_today') isProtectedToday!: boolean; // If today is protected
  @field('metadata') metadata!: string; // JSON string for additional data
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('profiles', 'user_id') user!: any;
}