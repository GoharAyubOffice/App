import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class DailyActivity extends Model {
  static table = 'daily_activities';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' },
  };

  @field('server_id') serverId!: string;
  @field('user_id') userId!: string;
  @date('activity_date') activityDate!: Date; // Date of the activity (normalized to start of day)
  @field('tasks_completed') tasksCompleted!: number;
  @field('tasks_created') tasksCreated!: number;
  @field('total_tasks') totalTasks!: number;
  @field('completion_rate') completionRate!: number; // Percentage (0-100)
  @field('active_time_minutes') activeTimeMinutes!: number;
  @field('habit_completions') habitCompletions!: number;
  @field('streak_days') streakDays!: number;
  @field('goals_achieved') goalsAchieved!: number;
  @field('metadata') metadata!: string; // JSON string for additional metrics
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('profiles', 'user_id') user!: any;
}