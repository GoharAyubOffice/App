import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Workspace extends Model {
  static table = 'workspaces';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'owner_id' },
    projects: { type: 'has_many', foreignKey: 'workspace_id' },
    tags: { type: 'has_many', foreignKey: 'workspace_id' },
    workspace_members: { type: 'has_many', foreignKey: 'workspace_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('owner_id') ownerId!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('profiles', 'owner_id') owner!: any;
  @children('projects') projects!: any;
  @children('tags') tags!: any;
  @children('workspace_members') members!: any;
}