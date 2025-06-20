import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db';
import { store } from '../store';
import { syncApi, PullChangesRequest, PushChangesRequest } from '../store/api/syncApi';

export interface SyncOptions {
  pullFilter?: {
    lastPulledAt?: number;
  };
  pushFilter?: {
    table?: string;
  };
  onProgress?: (progress: { phase: 'pull' | 'push'; completed: number; total: number }) => void;
  onError?: (error: Error) => void;
}

export class SyncService {
  private isSync = false;
  private lastSyncTimestamp = 0;
  private syncOptions: SyncOptions = {};

  constructor() {
    this.setupPeriodicSync();
  }

  async sync(options: SyncOptions = {}): Promise<void> {
    if (this.isSync) {
      throw new Error('Sync already in progress');
    }

    this.isSync = true;
    this.syncOptions = options;

    try {
      await synchronize({
        database,
        pullChanges: this.pullChanges.bind(this),
        pushChanges: this.pushChanges.bind(this),
        sendCreatedAsUpdated: true,
        log: __DEV__ ? console.log : undefined,
        conflictResolver: this.resolveConflict.bind(this),
        migrationsEnabledAtVersion: 1,
      });
      
      this.lastSyncTimestamp = Date.now();
      console.log('Sync completed successfully');
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncOptions.onError?.(error as Error);
      throw error;
    } finally {
      this.isSync = false;
    }
  }

  private async pullChanges(args: { lastPulledAt?: number; schemaVersion: number; migration?: any }) {
    const { lastPulledAt, schemaVersion, migration } = args;
    
    this.syncOptions.onProgress?.({ 
      phase: 'pull', 
      completed: 0, 
      total: 1 
    });

    const pullRequest: PullChangesRequest = {
      lastPulledAt: lastPulledAt || this.syncOptions.pullFilter?.lastPulledAt,
      schemaVersion,
      migration,
    };

    try {
      const result = await store.dispatch(
        syncApi.endpoints.pullChanges.initiate(pullRequest)
      ).unwrap();

      this.syncOptions.onProgress?.({ 
        phase: 'pull', 
        completed: 1, 
        total: 1 
      });

      return {
        changes: result.changes,
        timestamp: result.timestamp,
      };
      
    } catch (error) {
      console.error('Pull changes failed:', error);
      throw error;
    }
  }

  private async pushChanges(args: { changes: any[]; lastPulledAt: number }) {
    const { changes, lastPulledAt } = args;
    
    if (changes.length === 0) {
      return { experimentalRejectedIds: [] };
    }

    this.syncOptions.onProgress?.({ 
      phase: 'push', 
      completed: 0, 
      total: changes.length 
    });

    // Filter changes if needed
    let filteredChanges = changes;
    if (this.syncOptions.pushFilter?.table) {
      filteredChanges = changes.filter(change => 
        change.table === this.syncOptions.pushFilter?.table
      );
    }

    const pushRequest: PushChangesRequest = {
      changes: filteredChanges,
      lastPulledAt,
    };

    try {
      const result = await store.dispatch(
        syncApi.endpoints.pushChanges.initiate(pushRequest)
      ).unwrap();

      this.syncOptions.onProgress?.({ 
        phase: 'push', 
        completed: filteredChanges.length, 
        total: filteredChanges.length 
      });

      return {
        experimentalRejectedIds: result.experimentalRejectedIds || [],
      };
      
    } catch (error) {
      console.error('Push changes failed:', error);
      throw error;
    }
  }

  private resolveConflict(conflict: any) {
    // Simple conflict resolution: server wins
    // In production, you might want more sophisticated conflict resolution
    console.log('Resolving conflict:', conflict);
    
    // You can implement custom conflict resolution logic here
    // For now, we'll let the server version win
    return conflict.resolved;
  }

  private setupPeriodicSync() {
    // Setup periodic sync every 5 minutes when app is active
    setInterval(() => {
      if (!this.isSync && this.shouldPeriodicSync()) {
        this.sync().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private shouldPeriodicSync(): boolean {
    // Don't sync if we've synced recently (within last 2 minutes)
    const timeSinceLastSync = Date.now() - this.lastSyncTimestamp;
    return timeSinceLastSync > 2 * 60 * 1000;
  }

  // Public methods for manual sync control
  async syncTable(tableName: string): Promise<void> {
    return this.sync({
      pushFilter: { table: tableName },
    });
  }

  async syncSince(timestamp: number): Promise<void> {
    return this.sync({
      pullFilter: { lastPulledAt: timestamp },
    });
  }

  async forceSyncAll(): Promise<void> {
    return this.sync({
      pullFilter: { lastPulledAt: 0 },
    });
  }

  get isSyncing(): boolean {
    return this.isSync;
  }

  get lastSyncTime(): number {
    return this.lastSyncTimestamp;
  }

  // Helper methods for sync status
  async hasUnsyncedChanges(): Promise<boolean> {
    try {
      // Check if there are any dirty records
      const collections = [
        'profiles',
        'workspaces',
        'projects', 
        'tasks',
        'subtasks',
        'comments',
        'tags',
        'task_tags',
        'workspace_members',
        'attachments',
        'time_entries',
        'activity_logs'
      ];

      for (const collectionName of collections) {
        const collection = database.get(collectionName);
        const dirtyRecords = await collection
          .query(
            // @ts-ignore - WatermelonDB query typing
            where('is_dirty', true)
          )
          .fetch();
        
        if (dirtyRecords.length > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking unsynced changes:', error);
      return false;
    }
  }

  async getUnsyncedCount(): Promise<number> {
    try {
      const collections = [
        'profiles',
        'workspaces', 
        'projects',
        'tasks',
        'subtasks',
        'comments',
        'tags',
        'task_tags',
        'workspace_members',
        'attachments',
        'time_entries',
        'activity_logs'
      ];

      let totalCount = 0;

      for (const collectionName of collections) {
        const collection = database.get(collectionName);
        const dirtyRecords = await collection
          .query(
            // @ts-ignore - WatermelonDB query typing  
            where('is_dirty', true)
          )
          .fetch();
        
        totalCount += dirtyRecords.length;
      }

      return totalCount;
    } catch (error) {
      console.error('Error getting unsynced count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Export hook for React components
export function useSyncService() {
  return {
    sync: syncService.sync.bind(syncService),
    syncTable: syncService.syncTable.bind(syncService),
    syncSince: syncService.syncSince.bind(syncService),
    forceSyncAll: syncService.forceSyncAll.bind(syncService),
    isSyncing: syncService.isSyncing,
    lastSyncTime: syncService.lastSyncTime,
    hasUnsyncedChanges: syncService.hasUnsyncedChanges.bind(syncService),
    getUnsyncedCount: syncService.getUnsyncedCount.bind(syncService),
  };
}