import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Project extends Model {
  static table = 'projects';

  static associations: Associations = {
    workspaces: { type: 'belongs_to', key: 'workspace_id' },
    tasks: { type: 'has_many', foreignKey: 'project_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('workspace_id') workspaceId!: string;
  @field('color') color!: string;
  @field('is_archived') isArchived!: boolean;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('workspaces', 'workspace_id') workspace!: any;
  @children('tasks') tasks!: any;
}