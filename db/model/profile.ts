import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Profile extends Model {
  static table = 'profiles';

  static associations: Associations = {
    workspaces: { type: 'has_many', foreignKey: 'owner_id' },
    assigned_tasks: { type: 'has_many', foreignKey: 'assignee_id' },
    created_tasks: { type: 'has_many', foreignKey: 'created_by' },
    comments: { type: 'has_many', foreignKey: 'author_id' },
    attachments: { type: 'has_many', foreignKey: 'uploaded_by' },
    time_entries: { type: 'has_many', foreignKey: 'user_id' },
    workspace_members: { type: 'has_many', foreignKey: 'user_id' },
  };

  @field('server_id') serverId!: string;
  @field('email') email!: string;
  @field('full_name') fullName!: string;
  @field('avatar_url') avatarUrl!: string;
  @field('username') username!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @children('workspaces') ownedWorkspaces!: any;
  @children('tasks') assignedTasks!: any;
  @children('comments') comments!: any;
  @children('attachments') attachments!: any;
  @children('time_entries') timeEntries!: any;
  @children('workspace_members') workspaceMemberships!: any;
}