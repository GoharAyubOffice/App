import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Attachment extends Model {
  static table = 'attachments';

  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
    profiles: { type: 'belongs_to', key: 'uploaded_by' },
  };

  @field('server_id') serverId!: string;
  @field('filename') filename!: string;
  @field('file_path') filePath!: string;
  @field('file_size') fileSize!: number;
  @field('mime_type') mimeType!: string;
  @field('task_id') taskId!: string;
  @field('uploaded_by') uploadedBy!: string;
  @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt!: Date;
  @field('is_dirty') isDirty!: boolean;

  @relation('tasks', 'task_id') task!: any;
  @relation('profiles', 'uploaded_by') uploader!: any;
}