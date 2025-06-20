import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PullRequest {
  lastPulledAt?: number;
  schemaVersion: number;
  migration?: {
    from: number;
    to: number;
  };
}

interface Change {
  table: string;
  id: string;
  created?: any;
  updated?: any;
  deleted?: boolean;
}

interface PullResponse {
  changes: {
    [table: string]: Change[];
  };
  timestamp: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const pullRequest: PullRequest = await req.json()
    const { lastPulledAt, schemaVersion } = pullRequest
    
    const currentTimestamp = Date.now()
    const lastPulledDate = lastPulledAt ? new Date(lastPulledAt) : new Date(0)
    
    const changes: { [table: string]: Change[] } = {}
    
    // Define tables to sync
    const tables = [
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
    ]
    
    // Get user's accessible workspaces
    const { data: userWorkspaces } = await supabaseClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
    
    const workspaceIds = userWorkspaces?.map(w => w.workspace_id) || []
    
    for (const table of tables) {
      try {
        let query = supabaseClient
          .from(table)
          .select('*')
          .gte('updated_at', lastPulledDate.toISOString())
        
        // Apply workspace-based filtering for relevant tables
        if (['workspaces', 'projects', 'tasks', 'subtasks', 'comments', 'tags', 'task_tags', 'attachments', 'time_entries'].includes(table)) {
          if (workspaceIds.length === 0) continue
          
          if (table === 'workspaces') {
            query = query.in('id', workspaceIds)
          } else if (table === 'projects') {
            query = query.in('workspace_id', workspaceIds)
          } else if (['tasks', 'subtasks', 'comments', 'attachments', 'time_entries'].includes(table)) {
            // For these tables, we need to join through projects to get workspace access
            const { data: accessibleProjects } = await supabaseClient
              .from('projects')
              .select('id')
              .in('workspace_id', workspaceIds)
            
            const projectIds = accessibleProjects?.map(p => p.id) || []
            if (projectIds.length === 0) continue
            
            if (table === 'tasks') {
              query = query.in('project_id', projectIds)
            } else if (['subtasks', 'comments', 'attachments', 'time_entries'].includes(table)) {
              // Get accessible task IDs
              const { data: accessibleTasks } = await supabaseClient
                .from('tasks')
                .select('id')
                .in('project_id', projectIds)
              
              const taskIds = accessibleTasks?.map(t => t.id) || []
              if (taskIds.length === 0) continue
              
              query = query.in('task_id', taskIds)
            }
          } else if (['tags', 'task_tags'].includes(table)) {
            if (table === 'tags') {
              query = query.in('workspace_id', workspaceIds)
            } else {
              // For task_tags, get accessible tags and tasks
              const { data: accessibleTags } = await supabaseClient
                .from('tags')
                .select('id')
                .in('workspace_id', workspaceIds)
              
              const tagIds = accessibleTags?.map(t => t.id) || []
              if (tagIds.length === 0) continue
              
              query = query.in('tag_id', tagIds)
            }
          }
        } else if (table === 'profiles') {
          // Only return the current user's profile
          query = query.eq('id', user.id)
        } else if (table === 'workspace_members') {
          query = query.eq('user_id', user.id)
        } else if (table === 'activity_logs') {
          // Filter activity logs by accessible entities
          query = query.eq('user_id', user.id)
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error(`Error fetching ${table}:`, error)
          continue
        }
        
        if (data && data.length > 0) {
          changes[table] = data.map(row => ({
            table,
            id: row.id,
            created: row.created_at > lastPulledDate.toISOString() ? row : undefined,
            updated: row.created_at <= lastPulledDate.toISOString() ? row : undefined,
          }))
        }
      } catch (error) {
        console.error(`Error processing table ${table}:`, error)
      }
    }
    
    // Handle soft deletes by checking for records that should be deleted
    // This is a simplified approach - in production you might want a dedicated deleted_records table
    
    const response: PullResponse = {
      changes,
      timestamp: currentTimestamp,
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Sync pull error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})