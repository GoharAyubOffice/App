import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

export interface PullChangesRequest {
  lastPulledAt?: number;
  schemaVersion: number;
  migration?: {
    from: number;
    to: number;
  };
}

export interface PushChange {
  table: string;
  id: string;
  created?: any;
  updated?: any;
  deleted?: boolean;
}

export interface PushChangesRequest {
  changes: PushChange[];
  lastPulledAt: number;
}

export interface Change {
  table: string;
  id: string;
  created?: any;
  updated?: any;
  deleted?: boolean;
}

export interface PullChangesResponse {
  changes: {
    [table: string]: Change[];
  };
  timestamp: number;
}

export interface PushChangesResponse {
  experimentalRejectedIds?: string[];
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const syncApi = createApi({
  reducerPath: 'syncApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${SUPABASE_URL}/functions/v1/`,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.session?.access_token;
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Sync'],
  endpoints: (builder) => ({
    pullChanges: builder.mutation<PullChangesResponse, PullChangesRequest>({
      query: (pullRequest) => ({
        url: 'sync-pull',
        method: 'POST',
        body: pullRequest,
      }),
      transformResponse: (response: PullChangesResponse) => {
        // Transform server response to match WatermelonDB expectations
        const transformedChanges: { [table: string]: Change[] } = {};
        
        Object.entries(response.changes).forEach(([table, changes]) => {
          transformedChanges[table] = changes.map(change => ({
            ...change,
            // Ensure proper field mapping
            id: change.id,
            created: change.created ? transformServerRecord(change.created, table) : undefined,
            updated: change.updated ? transformServerRecord(change.updated, table) : undefined,
            deleted: change.deleted,
          }));
        });
        
        return {
          changes: transformedChanges,
          timestamp: response.timestamp,
        };
      },
      transformErrorResponse: (response) => {
        console.error('Pull changes error:', response);
        return response;
      },
    }),

    pushChanges: builder.mutation<PushChangesResponse, PushChangesRequest>({
      query: (pushRequest) => ({
        url: 'sync-push',
        method: 'POST',
        body: {
          ...pushRequest,
          changes: pushRequest.changes.map(change => ({
            ...change,
            created: change.created ? transformClientRecord(change.created, change.table) : undefined,
            updated: change.updated ? transformClientRecord(change.updated, change.table) : undefined,
          })),
        },
      }),
      transformErrorResponse: (response) => {
        console.error('Push changes error:', response);
        return response;
      },
    }),
  }),
});

function transformServerRecord(record: any, table: string): any {
  const transformed = { ...record };
  
  // Map server ID to local server_id field
  if (transformed.id) {
    transformed.server_id = transformed.id;
  }
  
  // Convert ISO strings to timestamps for WatermelonDB
  const dateFields = [
    'created_at',
    'updated_at', 
    'due_date',
    'completed_at',
    'joined_at',
    'start_time',
    'end_time'
  ];
  
  dateFields.forEach(field => {
    if (transformed[field]) {
      transformed[field] = new Date(transformed[field]).getTime();
    }
  });
  
  // Add sync metadata
  transformed.synced_at = Date.now();
  transformed.is_dirty = false;
  
  return transformed;
}

function transformClientRecord(record: any, table: string): any {
  const transformed = { ...record };
  
  // Convert timestamps to ISO strings for server
  const dateFields = [
    'created_at',
    'updated_at',
    'due_date', 
    'completed_at',
    'joined_at',
    'start_time',
    'end_time'
  ];
  
  dateFields.forEach(field => {
    if (transformed[field] && typeof transformed[field] === 'number') {
      transformed[field] = new Date(transformed[field]).toISOString();
    }
  });
  
  // Remove WatermelonDB-specific fields
  delete transformed.synced_at;
  delete transformed.is_dirty;
  delete transformed._status;
  delete transformed._changed;
  
  return transformed;
}

export const {
  usePullChangesMutation,
  usePushChangesMutation,
} = syncApi;