import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export type EntityType = 'task' | 'project' | 'workspace' | 'profile' | 'comment' | 'subtask';
export type ActionType = 'created' | 'updated' | 'deleted' | 'completed' | 'assigned' | 'commented';

export class ActivityLog extends Model {
  static table = 'activity_logs';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' },
  };

  @field('server_id') serverId!: string;
  @field('entity_type') entityType!: EntityType;
  @field('entity_id') entityId!: string;
  @field('action') action!: ActionType;
  @field('changes') changes!: string;
  @field('user_id') userId!: string;
  @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('profiles', 'user_id') user!: any;

  get parsedChanges() {
    try {
      return this.changes ? JSON.parse(this.changes) : {};
    } catch (error) {
      return {};
    }
  }
}