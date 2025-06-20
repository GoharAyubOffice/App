import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Tag extends Model {
  static table = 'tags';

  static associations: Associations = {
    workspaces: { type: 'belongs_to', key: 'workspace_id' },
    task_tags: { type: 'has_many', foreignKey: 'tag_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('color') color!: string;
  @field('workspace_id') workspaceId!: string;
  @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('workspaces', 'workspace_id') workspace!: any;
  @children('task_tags') taskTags!: any;
}