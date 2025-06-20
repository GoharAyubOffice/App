import { Model } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  unsyncedCount: number;
  hasUnsyncedChanges: boolean;
}

export interface SyncError {
  type: 'network' | 'server' | 'conflict' | 'permission' | 'unknown';
  message: string;
  code?: string;
  details?: any;
}

export class SyncUtils {
  static markAsDirty(model: Model): void {
    model.update((record: any) => {
      record.isDirty = true;
      record.syncedAt = null;
    });
  }

  static markAsSynced(model: Model): void {
    model.update((record: any) => {
      record.isDirty = false;
      record.syncedAt = Date.now();
    });
  }

  static createSyncQuery(tableName: string, lastSyncTime?: number) {
    if (lastSyncTime) {
      return [
        Q.or(
          Q.where('is_dirty', true),
          Q.where('synced_at', Q.gt(lastSyncTime)),
          Q.where('synced_at', null)
        )
      ];
    }
    return [Q.where('is_dirty', true)];
  }

  static handleSyncError(error: any): SyncError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        details: error,
      };
    }

    if (error.status >= 400 && error.status < 500) {
      return {
        type: error.status === 401 || error.status === 403 ? 'permission' : 'server',
        message: error.data?.message || `Server error: ${error.status}`,
        code: `HTTP_${error.status}`,
        details: error,
      };
    }

    if (error.status >= 500) {
      return {
        type: 'server',
        message: 'Server error occurred. Please try again later.',
        code: `HTTP_${error.status}`,
        details: error,
      };
    }

    if (error.message?.includes('conflict')) {
      return {
        type: 'conflict',
        message: 'Data conflict detected. Some changes may have been rejected.',
        code: 'SYNC_CONFLICT',
        details: error,
      };
    }

    return {
      type: 'unknown',
      message: error.message || 'An unknown error occurred during sync.',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }

  static formatSyncStatus(status: Partial<SyncStatus>): string {
    if (status.isSyncing) {
      return 'Syncing...';
    }

    if (!status.isOnline) {
      return 'Offline';
    }

    if (status.hasUnsyncedChanges) {
      const count = status.unsyncedCount || 0;
      return `${count} change${count !== 1 ? 's' : ''} pending`;
    }

    if (status.lastSyncTime) {
      const timeDiff = Date.now() - status.lastSyncTime;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `Synced ${days} day${days !== 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        return `Synced ${hours} hour${hours !== 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
        return `Synced ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      } else {
        return 'Just synced';
      }
    }

    return 'Never synced';
  }

  static shouldAttemptSync(
    isOnline: boolean,
    isSyncing: boolean,
    lastSyncTime: number | null,
    minSyncInterval: number = 30000 // 30 seconds
  ): boolean {
    if (!isOnline || isSyncing) {
      return false;
    }

    if (!lastSyncTime) {
      return true;
    }

    return Date.now() - lastSyncTime > minSyncInterval;
  }

  static getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, 30000); // Max 30 seconds
  }

  static createBatchProcessor<T>(
    items: T[],
    batchSize: number = 50,
    processor: (batch: T[]) => Promise<void>
  ) {
    return async function processBatches() {
      const batches = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await processor(batch);
      }
    };
  }

  static validateSyncData(data: any, table: string): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Basic validation - ensure required fields exist
    const requiredFields: { [key: string]: string[] } = {
      profiles: ['email'],
      workspaces: ['name', 'owner_id'],
      projects: ['name', 'workspace_id'],
      tasks: ['title', 'project_id', 'created_by'],
      subtasks: ['title', 'task_id'],
      comments: ['content', 'task_id', 'author_id'],
      tags: ['name', 'workspace_id'],
      task_tags: ['task_id', 'tag_id'],
      workspace_members: ['workspace_id', 'user_id'],
      attachments: ['filename', 'file_path', 'task_id', 'uploaded_by'],
      time_entries: ['task_id', 'user_id', 'duration'],
      activity_logs: ['entity_type', 'entity_id', 'action'],
    };

    const required = requiredFields[table] || [];
    
    return required.every(field => {
      const value = data[field];
      return value !== null && value !== undefined && value !== '';
    });
  }

  static sanitizeSyncData(data: any, table: string): any {
    const sanitized = { ...data };

    // Remove internal WatermelonDB fields
    delete sanitized._status;
    delete sanitized._changed;

    // Ensure proper types for common fields
    if (sanitized.position !== undefined) {
      sanitized.position = Number(sanitized.position) || 0;
    }

    if (sanitized.duration !== undefined) {
      sanitized.duration = Number(sanitized.duration) || 0;
    }

    if (sanitized.file_size !== undefined) {
      sanitized.file_size = Number(sanitized.file_size) || 0;
    }

    // Boolean fields
    const booleanFields = ['is_completed', 'is_archived', 'is_dirty'];
    booleanFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = Boolean(sanitized[field]);
      }
    });

    // Ensure string fields are strings
    const stringFields = ['title', 'name', 'description', 'content', 'filename'];
    stringFields.forEach(field => {
      if (sanitized[field] !== undefined && sanitized[field] !== null) {
        sanitized[field] = String(sanitized[field]);
      }
    });

    return sanitized;
  }

  static logSyncOperation(
    operation: 'pull' | 'push',
    table: string,
    count: number,
    duration: number,
    errors?: any[]
  ): void {
    const message = `Sync ${operation} completed for ${table}: ${count} records in ${duration}ms`;
    
    if (errors && errors.length > 0) {
      console.warn(message, { errors });
    } else {
      console.log(message);
    }
  }
}

export default SyncUtils;