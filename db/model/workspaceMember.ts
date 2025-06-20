import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export type WorkspaceMemberRole = 'owner' | 'admin' | 'member';

export class WorkspaceMember extends Model {
  static table = 'workspace_members';

  static associations: Associations = {
    workspaces: { type: 'belongs_to', key: 'workspace_id' },
    profiles: { type: 'belongs_to', key: 'user_id' },
  };

  @field('server_id') serverId!: string;
  @field('workspace_id') workspaceId!: string;
  @field('user_id') userId!: string;
  @field('role') role!: WorkspaceMemberRole;
  @date('joined_at') joinedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('workspaces', 'workspace_id') workspace!: any;
  @relation('profiles', 'user_id') user!: any;
}